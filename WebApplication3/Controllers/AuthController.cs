using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using WebApplication3.Data.Entities;
using WebApplication3.Models;

namespace WebApplication3.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class AuthController : ControllerBase
    {
        private readonly UserManager <ApplicationUser> _userManager;
        private readonly IConfiguration configuration;

        public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            this.configuration = configuration;
        }


        public async Task<IActionResult> Register(RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);

            }

            var user = await _userManager.FindByNameAsync(model.UserName);

            if (user == null)
            {
                return BadRequest(new
                {
                    message = "UserName already exist",
                });
            }

            var result = await _userManager.CheckPasswordAsync(user, model.Password);

            if (result == false)
            {
                return Unauthorized(new
                {    
                    message = "Password or UserName doesn't match"
                });
            }

            var token = GenerateJWTToken(user);

            return Ok(new
            {
                token = token
            });
        }


    }


}
