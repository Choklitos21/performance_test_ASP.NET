using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using performance_test.Domain.Entities;
using performance_test.Domain.Enums;

namespace performance_test.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(
        AppDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        await context.Database.MigrateAsync();

        string[] roles = ["Owner", "Guest"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        if (await userManager.FindByEmailAsync("owner@test.com") == null)
        {
            var owner = new ApplicationUser
            {
                UserName = "owner@test.com",
                Email = "owner@test.com",
                FullName = "Test Owner",
                EmailConfirmed = true,
                KycStatus = KycStatus.Approved
            };
            await userManager.CreateAsync(owner, "Owner123!");
            await userManager.AddToRoleAsync(owner, "Owner");

            context.Properties.AddRange(
                new Property
                {
                    OwnerId = owner.Id,
                    Title = "Cozy Apartment in City Center",
                    Description = "A beautiful apartment with great views of the city.",
                    Location = "Bogotá, Colombia",
                    PricePerNight = 150000,
                    IsActive = true
                },
                new Property
                {
                    OwnerId = owner.Id,
                    Title = "Beach House in Cartagena",
                    Description = "Relax steps away from the beach.",
                    Location = "Cartagena, Colombia",
                    PricePerNight = 280000,
                    IsActive = true
                }
            );
            await context.SaveChangesAsync();
        }

        if (await userManager.FindByEmailAsync("guest@test.com") == null)
        {
            var guest = new ApplicationUser
            {
                UserName = "guest@test.com",
                Email = "guest@test.com",
                FullName = "Test Guest",
                EmailConfirmed = true,
                KycStatus = KycStatus.Approved
            };
            await userManager.CreateAsync(guest, "Guest123!");
            await userManager.AddToRoleAsync(guest, "Guest");
        }
    }
}
