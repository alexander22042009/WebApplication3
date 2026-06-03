namespace HouseRentingSystemApi.UseStopWatchMiddleWare
{
    public class UseStopWatchMiddleWare
    {
        private readonly RequestDelegate _next;

        public UseStopWatchMiddleWare(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            await _next(context);
            stopwatch.Stop();

            Console.WriteLine(
                $"[{DateTime.UtcNow:O}] {context.Request.Method} {context.Request.Path} " +
                $"=> {context.Response.StatusCode} in {stopwatch.ElapsedMilliseconds} ms");
        }   
    }
}
