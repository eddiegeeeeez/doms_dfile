using DFile.backend.Data;
using DFile.backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DFile.backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PurchaseOrders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrder>>> GetPurchaseOrders()
        {
            return await _context.PurchaseOrders.ToListAsync();
        }

        // GET: api/PurchaseOrders/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrder>> GetPurchaseOrder(string id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null) return NotFound();
            return order;
        }

        // POST: api/PurchaseOrders
        [HttpPost]
        public async Task<ActionResult<PurchaseOrder>> CreatePurchaseOrder(PurchaseOrder order)
        {
            if (string.IsNullOrWhiteSpace(order.Id))
                order.Id = $"PO-{DateTime.UtcNow:yyyyMMddHHmmssfff}";

            order.CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd");

            _context.PurchaseOrders.Add(order);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (_context.PurchaseOrders.Any(p => p.Id == order.Id))
                    return Conflict();
                throw;
            }

            return CreatedAtAction(nameof(GetPurchaseOrder), new { id = order.Id }, order);
        }

        // PUT: api/PurchaseOrders/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePurchaseOrder(string id, PurchaseOrder order)
        {
            if (id != order.Id) return BadRequest();

            _context.Entry(order).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.PurchaseOrders.Any(p => p.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // PUT: api/PurchaseOrders/archive/{id}
        [HttpPut("archive/{id}")]
        public async Task<IActionResult> ArchivePurchaseOrder(string id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null) return NotFound();

            order.Archived = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/PurchaseOrders/restore/{id}
        [HttpPut("restore/{id}")]
        public async Task<IActionResult> RestorePurchaseOrder(string id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null) return NotFound();

            order.Archived = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
