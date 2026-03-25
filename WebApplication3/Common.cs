using WebApplication3.Models.Houses;

namespace WebApplication3;

public class Common
{
    public IEnumerable<HouseDetailsViewModel> GetHouses()
    {
        return new List<HouseDetailsViewModel>
        {
            new()
            {
                Title = "House on the beach",
                Address = "Florida,Miami",  
                ImageUrl = "https://images.mansionglobal.com/im-73534380"
            },
            new()
            {
                Title = "Mountain house",
                Address = "Rila Mountain",
                ImageUrl = "https://static.workaway.info/gfx/foto/5/3/4/9/9/534999836525/xl/534999836525_148985760506288.jpg"
            },
            new()
            {
                Title = "House",
                Address = "Sofia,Lulin",
                ImageUrl = "https://www.alo.bg/user_files/n/nedvijimiimotipernikeood/10694713_141151873_medium.jpg"
            }
        };
    }
}
