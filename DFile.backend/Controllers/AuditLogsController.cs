using DFile.backend.Data;
using DFile.backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DFile.backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Finance,Maintenance,Super Admin")]
    public class AuditLogsController : TenantAwareController
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAuditLogs(
            [FromQuery] string? entityType = null,
            [FromQuery] string? action = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var tenantId = GetCurrentTenantId();
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            if (!IsSuperAdmin() && tenantId.HasValue)
            {
                query = query.Where(a => a.TenantId == tenantId);
            }

            if (!string.IsNullOrEmpty(entityType))
            {
                query = query.Where(a => a.EntityType == entityType);
            }

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(a => a.Action == action);
            }

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.Id,
                    a.Action,
                    a.EntityType,
                    a.EntityId,
                    a.UserId,
                    UserName = a.User != null ? a.User.FirstName + " " + a.User.LastName : null,
                    a.TenantId,
                    a.OldValues,
                    a.NewValues,
                    a.IpAddress,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, data = logs });
        }

        [HttpGet("summary")]
        [Authorize(Roles = "Super Admin")]
        public async Task<ActionResult> GetAuditSummary()
        {
            var today = DateTime.UtcNow.Date;
            var weekAgo = today.AddDays(-7);

            var totalLogs = await _context.AuditLogs.CountAsync();
            var todayLogs = await _context.AuditLogs.CountAsync(a => a.CreatedAt >= today);
            var weekLogs = await _context.AuditLogs.CountAsync(a => a.CreatedAt >= weekAgo);

            var byAction = await _context.AuditLogs
                .GroupBy(a => a.Action)
                .Select(g => new { Action = g.Key, Count = g.Count() })
                .ToListAsync();

            var byEntity = await _context.AuditLogs
                .GroupBy(a => a.EntityType)
                .Select(g => new { EntityType = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new { totalLogs, todayLogs, weekLogs, byAction, byEntity });
        }
    }
}
