using Microsoft.AspNetCore.Identity;
using performance_test.Domain.Enums;

namespace performance_test.Infrastructure.Persistence;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public KycStatus KycStatus { get; set; } = KycStatus.Pending;
}
