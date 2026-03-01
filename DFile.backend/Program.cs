using DFile.backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddScoped<DFile.backend.Controllers.RequireTenantFilter>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), sqlOptions => 
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    }));

// Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key is not configured. Set Jwt:Key in appsettings or environment variables.");
var key = Encoding.ASCII.GetBytes(jwtKey);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.

// 1. Static files FIRST — lets IIS/Kestrel short-circuit for .js/.css/etc.
//    without passing through auth or CORS middleware on every asset request.
//    Do NOT call UseDefaultFiles() — MapFallbackToFile handles the root redirect.
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var headers = ctx.Context.Response.Headers;
        var requestPath = ctx.Context.Request.Path.Value ?? "";

        if (requestPath.StartsWith("/_next/static/", StringComparison.OrdinalIgnoreCase))
        {
            // Content-hashed filenames — safe to cache forever in browser and CDN.
            // On redeploy the hash changes, guaranteeing a fresh fetch.
            headers["Cache-Control"] = "public, max-age=31536000, immutable";
        }
        else if (ctx.File.Name.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            // HTML files must never be served stale — always revalidate so the
            // browser fetches the latest index.html after a redeploy.
            headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            headers["Pragma"] = "no-cache";
            headers["Expires"] = "0";
        }
        else
        {
            // Other static assets (images, SVGs, fonts, icons) — 1-day cache
            headers["Cache-Control"] = "public, max-age=86400";
        }
    }
});

// 2. Swagger — development only
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 3. CORS before auth/controllers
app.UseCors("AllowAll");

// 4. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// 5. Health endpoint (always-on, no sensitive data)
app.MapGet("/api/health", () => Results.Ok("API is Healthy"));

// DB connectivity check — development only
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/db-test", (AppDbContext db) =>
    {
        try
        {
            return db.Database.CanConnect()
                ? Results.Ok("Database connection successful.")
                : Results.Problem("Database connection failed (CanConnect returned false). Check logs for details.");
        }
        catch (Exception ex)
        {
            return Results.Problem($"Database connection error: {ex.Message}");
        }
    });
}

// 6. Map controllers (all /api/* routes)
app.MapControllers();

// Explicitly return 404 for any /api/* route that wasn't matched by a controller.
// This prevents the SPA fallback from silently swallowing unmatched API calls
// and returning index.html with HTTP 200, which masks real routing errors.
app.Map("/api/{**rest}", (HttpContext context) =>
    Results.NotFound(new { error = "API endpoint not found", path = context.Request.Path.Value }));

// SPA fallback: serve index.html for all non-API, non-swagger, non-static routes
// so that client-side routing (e.g. /dashboard, /login) works on hard-refresh.
app.MapFallbackToFile("index.html");

// Seed Database in background — do NOT block app.Run().
// Blocking startup here causes ANCM startup timeout on IIS hosted deployments.
_ = Task.Run(async () =>
{
    await Task.Delay(2000); // Give the app a moment to fully initialize
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        if (context.Database.CanConnect())
        {
            Console.WriteLine("Database connection successful. Seeding...");
            DbInitializer.Initialize(context);
        }
        else
        {
            Console.WriteLine("WARNING: Could not connect to the database.");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "CRITICAL ERROR: An error occurred creating the DB.");
        Console.WriteLine($"CRITICAL ERROR: {ex.Message}");
        if (ex.InnerException != null) Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
    }
});

app.Run();
