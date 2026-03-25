using System.ComponentModel.DataAnnotations;
using static WebApplication3.Data.DataConstants.Agent;

namespace WebApplication3.Data.Entities;

public class Agent
{
    public Guid Id { get; set; }

    [Required]
    [MinLength(PhoneNumberMinLength)]
    [MaxLength(PhoneNumberMaxLength)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    public ICollection<House> ManagedHouses { get; set; } = new HashSet<House>();
}
