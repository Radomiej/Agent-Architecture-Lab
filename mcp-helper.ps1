$global:bearer = "vn2mxvuvy3b3rgnd77r1y4cxs62in8j6jyniwz4itu8wyprjlg"
$global:sid = "246JMATAJ5XOLWQ72QMKKI4KXB"
$global:mcpId = 10

function global:mcp($method, [string]$paramsJson) {
  $global:mcpId++
  $h = @{
    "Content-Type"="application/json"
    "Accept"="application/json, text/event-stream"
    "MCP-Protocol-Version"="2025-03-26"
    "Authorization"="Bearer $global:bearer"
    "Mcp-Session-Id"=$global:sid
  }
  $body = "{`"jsonrpc`":`"2.0`",`"id`":$($global:mcpId),`"method`":`"$method`",`"params`":$paramsJson}"
  $r = Invoke-WebRequest -Uri "http://localhost:8808/mcp" -Method POST -Headers $h -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -UseBasicParsing
  foreach ($line in ($r.Content -split "`n")) {
    if ($line.StartsWith("data: ")) {
      try { return ($line.Substring(6) | ConvertFrom-Json) } catch {}
    }
  }
  try { return ($r.Content | ConvertFrom-Json) } catch { return $r.Content }
}

function global:mcpTool($name, [string]$argsJson = "{}") {
  $params = "{`"name`":`"$name`",`"arguments`":$argsJson}"
  $r = mcp "tools/call" $params
  if ($r.result -and $r.result.content) {
    return ($r.result.content | ForEach-Object { $_.text }) -join "`n"
  }
  if ($r.error) { return "ERROR: $($r.error.message)" }
  return $r
}

Write-Host "MCP helper loaded."
