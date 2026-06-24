using Microsoft.EntityFrameworkCore;
using performance_test.Application.DTOs.Dashboard;
using performance_test.Infrastructure.Persistence;
using performance_test.Domain.Enums;

namespace performance_test.Application.Services;

public class DashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context) => _context = context;

    public async Task<DashboardDto> GetDashboardAsync(string ownerId, DateTime? from, DateTime? to)
    {
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-12);
        var toDate = to ?? DateTime.UtcNow;

        var properties = await _context.Properties
            .Where(p => p.OwnerId == ownerId)
            .ToListAsync();

        var propertyIds = properties.Select(p => p.Id).ToList();

        var reservations = await _context.Reservations
            .Where(r => propertyIds.Contains(r.PropertyId) &&
                        r.CheckIn >= fromDate && r.CheckIn <= toDate &&
                        (r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Completed))
            .ToListAsync();

        var totalRevenue = reservations.Sum(r => r.TotalPrice);
        var totalDays = (toDate - fromDate).TotalDays;

        var propertyMetrics = properties.Select(p =>
        {
            var propReservations = reservations.Where(r => r.PropertyId == p.Id).ToList();
            var occupiedDays = propReservations.Sum(r => (r.CheckOut - r.CheckIn).TotalDays);
            return new PropertyMetricsDto
            {
                PropertyId = p.Id,
                Title = p.Title,
                ReservationCount = propReservations.Count,
                Revenue = propReservations.Sum(r => r.TotalPrice),
                OccupancyRate = totalDays > 0 ? Math.Round(occupiedDays / totalDays * 100, 1) : 0
            };
        }).ToList();

        var totalOccupied = reservations.Sum(r => (r.CheckOut - r.CheckIn).TotalDays);
        var maxPossible = properties.Count * totalDays;

        return new DashboardDto
        {
            TotalProperties = properties.Count,
            TotalReservations = reservations.Count,
            TotalRevenue = totalRevenue,
            OccupancyRate = maxPossible > 0 ? Math.Round(totalOccupied / maxPossible * 100, 1) : 0,
            PropertyMetrics = propertyMetrics
        };
    }
}
