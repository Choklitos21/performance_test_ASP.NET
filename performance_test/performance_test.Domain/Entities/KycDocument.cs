using performance_test.Domain.Enums;

namespace performance_test.Domain.Entities;

public class KycDocument
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? DocumentImagePath { get; set; }
    public KycStatus Status { get; set; } = KycStatus.Pending;
    public string? ExtractedName { get; set; }
    public string? ExtractedSurname { get; set; }
    public string? ExtractedDocumentNumber { get; set; }
    public DateTime? ExtractedBirthDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
