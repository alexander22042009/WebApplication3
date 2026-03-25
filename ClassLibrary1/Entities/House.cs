using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static ClassLibrary1.DataConstants.DataConstants.House;

namespace ClassLibrary1.Entities;

public class House
{
    public int Id { get; init; }

    [Required]
    [MaxLength(TitleMaxLength)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(AddressMaxLength)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MaxLength(DescriptionMaxLength)]
    public string Description { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

    public decimal PricePerMonth { get; set; }

    public Category Category { get; set; } = null!;

    [ForeignKey(nameof(Category))]
    public int CategoryId { get; set; }
}
