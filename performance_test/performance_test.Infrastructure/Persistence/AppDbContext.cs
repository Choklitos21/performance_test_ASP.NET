using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using performance_test.Domain.Entities;
using performance_test.Domain.Enums;

namespace performance_test.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Property> Properties => Set<Property>();
    public DbSet<PropertyPhoto> PropertyPhotos => Set<PropertyPhoto>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<KycDocument> KycDocuments => Set<KycDocument>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Property>()
            .Property(p => p.PricePerNight)
            .HasPrecision(18, 2);

        builder.Entity<Reservation>()
            .Property(r => r.TotalPrice)
            .HasPrecision(18, 2);

        builder.Entity<Wishlist>()
            .HasIndex(w => new { w.UserId, w.PropertyId })
            .IsUnique();

        builder.Entity<Property>()
            .HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Reservation>()
            .HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Wishlist>()
            .HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<KycDocument>()
            .HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(k => k.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Notification>()
            .HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Reservation>()
            .HasIndex(r => new { r.PropertyId, r.Status });
    }
}
