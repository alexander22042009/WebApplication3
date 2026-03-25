using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WebApplication3.Data.Entities;

namespace WebApplication3.Data;

public class HouseRentingDbContext : IdentityDbContext<ApplicationUser>
{
    public HouseRentingDbContext(DbContextOptions<HouseRentingDbContext> options)
        : base(options)
    {
    }

    public DbSet<House> Houses { get; set; } = null!;

    public DbSet<Category> Categories { get; set; } = null!;

    public DbSet<Agent> Agents { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
    }
}
