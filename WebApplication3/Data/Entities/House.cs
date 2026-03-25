using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static WebApplication3.Data.DataConstants.House;

namespace WebApplication3.Data.Entities;

public class House
{
    public int Id { get; set; }

    [Required]
    [MinLength(TitleMinLength)]
    [MaxLength(TitleMaxLength)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MinLength(AddressMinLength)]
    [MaxLength(AddressMaxLength)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MinLength(DescriptionMinLength)]
    [MaxLength(DescriptionMaxLength)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string ImageUrl { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Range(typeof(decimal), PricePerMonthMinValue, PricePerMonthMaxValue)]
    public decimal PricePerMonth { get; set; }

    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;

    public Guid AgentId { get; set; }

    public Agent Agent { get; set; } = null!;

    public string? RenterId { get; set; }

    public ApplicationUser? Renter { get; set; }
}
