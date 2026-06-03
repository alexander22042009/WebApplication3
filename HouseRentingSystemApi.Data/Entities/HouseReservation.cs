using System.ComponentModel.DataAnnotations.Schema;

namespace HouseRentingSystemApi.Data.Entities
{
    public class HouseReservation
    {
        public int Id { get; set; }

        public House House { get; set; } = null!;

        [ForeignKey(nameof(House))]
        public int HouseId { get; set; }

        public ApplicationUser User { get; set; } = null!;

        [ForeignKey(nameof(User))]
        public string UserId { get; set; } = string.Empty;

        public DateTime CreatedAtUtc { get; set; }
    }
}
