using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using performance_test.Infrastructure.Persistence;

namespace performance_test.Application.Services;

public class ReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context) => _context = context;

    public async Task<byte[]> GenerateOwnerReportAsync(
        string ownerId,
        int? propertyId,
        DateTime? from,
        DateTime? to)
    {
        ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;

        var query = _context.Reservations
            .Include(r => r.Property)
            .Where(r => r.Property.OwnerId == ownerId);

        if (propertyId.HasValue)
            query = query.Where(r => r.PropertyId == propertyId.Value);

        if (from.HasValue)
            query = query.Where(r => r.CheckIn >= from.Value);

        if (to.HasValue)
            query = query.Where(r => r.CheckOut <= to.Value);

        var reservations = await query.OrderByDescending(r => r.CheckIn).ToListAsync();

        var guestIds = reservations.Select(r => r.GuestId).Distinct().ToList();
        var guests = await _context.Users
            .Where(u => guestIds.Contains(u.Id))
            .ToListAsync();
        var guestMap = guests.ToDictionary(g => g.Id);

        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add("Reservations");

        string[] headers = ["ID", "Property", "Guest Name", "Guest Email", "Check-In", "Check-Out", "Total Price (COP)", "Status"];
        for (var i = 0; i < headers.Length; i++)
        {
            sheet.Cells[1, i + 1].Value = headers[i];
            sheet.Cells[1, i + 1].Style.Font.Bold = true;
        }

        var row = 2;
        foreach (var r in reservations)
        {
            guestMap.TryGetValue(r.GuestId, out var guest);
            sheet.Cells[row, 1].Value = r.Id;
            sheet.Cells[row, 2].Value = r.Property.Title;
            sheet.Cells[row, 3].Value = guest?.FullName ?? "Unknown";
            sheet.Cells[row, 4].Value = guest?.Email ?? "Unknown";
            sheet.Cells[row, 5].Value = r.CheckIn.ToString("dd/MM/yyyy HH:mm");
            sheet.Cells[row, 6].Value = r.CheckOut.ToString("dd/MM/yyyy HH:mm");
            sheet.Cells[row, 7].Value = r.TotalPrice;
            sheet.Cells[row, 8].Value = r.Status.ToString();
            row++;
        }

        sheet.Cells[sheet.Dimension?.Address ?? "A1:H1"].AutoFitColumns();

        return await package.GetAsByteArrayAsync();
    }
}
