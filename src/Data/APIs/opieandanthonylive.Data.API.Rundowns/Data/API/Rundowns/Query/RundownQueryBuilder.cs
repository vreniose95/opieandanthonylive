﻿using opieandanthonylive.Data.API.Common.Query;
using opieandanthonylive.Data.API.Infrastructure;

namespace opieandanthonylive.Data.API.Rundowns.Query
{
  public class RundownQueryBuilder
    : IRundownQueryBuilder,
      IQueryBuilder
  {
    public string BuildRequestUrl(
      DomainFragment requestBuilder)
    {
      return requestBuilder
        .Builder
        .WithPath("vbulletin")
        .WithPath("archive")
        .WithPath("index.php")
        .WithPath("f-61.html")
        .Build();
    }
  }
}
