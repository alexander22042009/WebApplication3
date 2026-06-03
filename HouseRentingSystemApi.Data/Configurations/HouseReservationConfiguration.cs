using HouseRentingSystemApi.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HouseRentingSystemApi.Data.Configurations
{
    internal class HouseReservationConfiguration : IEntityTypeConfiguration<HouseReservation>
    {
        public void Configure(EntityTypeBuilder<HouseReservation> builder)
        {
            builder.HasIndex(x => new { x.HouseId, x.UserId }).IsUnique();
            builder.HasOne(x => x.House)
                .WithMany()
                .HasForeignKey(x => x.HouseId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
