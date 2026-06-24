namespace performance_test.Domain.Entities;

public class PropertyPhoto
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public string Url { get; set; } = string.Empty;
    public int Order { get; set; }

    public Property Property { get; set; } = null!;
}
