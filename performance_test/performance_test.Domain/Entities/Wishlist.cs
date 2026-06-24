namespace performance_test.Domain.Entities;

public class Wishlist
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int PropertyId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Property Property { get; set; } = null!;
}
