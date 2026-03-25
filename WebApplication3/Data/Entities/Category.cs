using System.ComponentModel.DataAnnotations;
using static WebApplication3.Data.DataConstants.Category;

namespace WebApplication3.Data.Entities;

public class Category
{
    public int Id { get; set; }

    [Required]
    [MaxLength(NameMaxLength)]
    public string Name { get; set; } = string.Empty;

    public ICollection<House> Houses { get; set; } = new HashSet<House>();
}
