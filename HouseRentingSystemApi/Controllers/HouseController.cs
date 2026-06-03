using HouseRentingSystemApi.Authorization;
using HouseRentingSystemApi.Models;
using HouseRentingSystemApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HouseRentingSystemApi.Controllers
{
    [Route("api/[controller]")]
    public class HouseController : ControllerBase
    {
        private readonly IHouseService houseService;

        public HouseController(IHouseService houseService)
        {
            this.houseService = houseService;
        }

        [HttpGet("All")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 6)
        {
            var result = await houseService.GetAllAsync(search, category, minPrice, maxPrice, page, pageSize);
            return Ok(new { items = result.Items, totalCount = result.TotalCount, page = result.Page, pageSize = result.PageSize });
        }

        [HttpGet("PriceRanges")]
        public async Task<IActionResult> PriceRanges([FromQuery] string? category)
        {
            var ranges = await houseService.GetPriceRangesAsync(category);
            var data = ranges.Select(r => new
            {
                min = r.Min,
                max = r.Max,
                count = r.Count,
                label = $"{r.Min:0}-{r.Max:0} ({r.Count})"
            });
            return Ok(data);
        }

        [HttpGet("Categories")]
        public async Task<IActionResult> Categories()
        {
            var categories = await houseService.GetCategoriesAsync();
            return Ok(categories);
        }

        [Authorize(Roles = AppRoles.Agent)]
        [HttpGet("Mine")]
        public async Task<IActionResult> Mine([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 6)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await houseService.GetMineAsync(userId!, search, page, pageSize);
            return Ok(new { items = result.Items, totalCount = result.TotalCount, page = result.Page, pageSize = result.PageSize });
        }

        [HttpGet("{id}")]
        [Produces(typeof(HouseDetailModel))]
        public async Task<IActionResult> GetById(int id)
        {
            var house = await houseService.GetByIdAsync(id);
            if (house == null)
            {
                return NotFound();
            }

            return Ok(house);
        }
        [Authorize(Roles = AppRoles.Agent)]
        [HttpPost]
        [Produces(typeof(HouseDetailModel))]
        public async Task<IActionResult> Create([FromBody] HouseDetailModel model)
        {
            if (ModelState.IsValid == false)
            {
                return BadRequest();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var newHouse = await houseService.CreateAsync(model, userId!);
            return Created($"api/{newHouse.Id}", newHouse);
        }

        [Authorize(Roles = AppRoles.Agent)]
        [HttpPut("{id}")]
        [Produces(typeof(HouseDetailModel))]
        public async Task<IActionResult> Edit(int id, [FromBody] HouseDetailModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await houseService.EditAsync(id, model, userId!);
            if (result.IsNotFound)
            {
                return NotFound();
            }

            if (result.IsForbidden)
            {
                return Forbid();
            }

            return Ok(result.House);
        }

        [Authorize(Roles = AppRoles.Agent)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await houseService.DeleteAsync(id, userId!);
            if (result.IsNotFound)
            {
                return NotFound();
            }

            if (result.IsForbidden)
            {
                return Forbid();
            }

            return Ok(new { message = "House deleted successfully." });
        }

        [Authorize(Roles = AppRoles.Customer)]
        [HttpPost("{id:int}/reserve")]
        public async Task<IActionResult> Reserve(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var result = await houseService.ReserveAsync(id, userId);
            if (result.NotFound)
            {
                return NotFound();
            }

            if (result.Duplicate)
            {
                return Conflict(new { message = "You already reserved this house." });
            }

            return Ok(new { message = "Reservation submitted." });
        }
    }
}