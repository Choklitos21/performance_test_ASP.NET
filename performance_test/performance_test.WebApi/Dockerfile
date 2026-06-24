FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["performance_test.WebApi/performance_test.WebApi.csproj", "performance_test.WebApi/"]
COPY ["performance_test.Application/performance_test.Application.csproj", "performance_test.Application/"]
COPY ["performance_test.Infrastructure/performance_test.Infrastructure.csproj", "performance_test.Infrastructure/"]
COPY ["performance_test.Domain/performance_test.Domain.csproj", "performance_test.Domain/"]
RUN dotnet restore "performance_test.WebApi/performance_test.WebApi.csproj"
COPY . .
WORKDIR "/src/performance_test.WebApi"
RUN dotnet build "./performance_test.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./performance_test.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "performance_test.WebApi.dll"]
