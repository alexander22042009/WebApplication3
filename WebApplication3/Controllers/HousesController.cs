    using Microsoft.AspNetCore.Mvc;
using WebApplication3.Models.Houses;

namespace WebApplication3.Controllers;

public class HousesController : Controller
{
    public IActionResult All()
    {
        var common = new Common();
        var houses = common.GetHouses();
        var model = new AllHousesViewModel
        {
            Houses = houses
        };

        return View(model);
    }

    public IActionResult Details()
    {
        var common = new Common();
        var house = common.GetHouses().First();

        return View(house);
    }
}
