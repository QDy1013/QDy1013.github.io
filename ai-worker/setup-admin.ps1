$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$form=New-Object System.Windows.Forms.Form
$form.Text='博客 AI - 设置管理员账号'
$form.ClientSize=New-Object System.Drawing.Size(530,400)
$form.StartPosition='CenterScreen'
$form.FormBorderStyle='FixedDialog'
$form.MaximizeBox=$false
$form.TopMost=$true
$form.Font=New-Object System.Drawing.Font('Microsoft YaHei UI',10)
function Add-Label($text,$x,$y,$width,$height) {
  $label=New-Object System.Windows.Forms.Label
  $label.Text=$text; $label.Location=New-Object System.Drawing.Point($x,$y)
  $label.Size=New-Object System.Drawing.Size($width,$height)
  $form.Controls.Add($label)
}
Add-Label '请在这里填写。密码不会出现在聊天或日志中。' 25 20 480 28
Add-Label '用户名（3–32 位字母、数字、下划线或短横线）' 25 65 480 25
$username=New-Object System.Windows.Forms.TextBox
$username.Text='qdy1013'; $username.Location=New-Object System.Drawing.Point(25,93)
$username.Size=New-Object System.Drawing.Size(475,30); $form.Controls.Add($username)
Add-Label '密码（10–128 位，请自行保存）' 25 137 480 25
$password=New-Object System.Windows.Forms.TextBox
$password.UseSystemPasswordChar=$true; $password.Location=New-Object System.Drawing.Point(25,165)
$password.Size=New-Object System.Drawing.Size(475,30); $form.Controls.Add($password)
Add-Label '再次输入密码' 25 209 480 25
$confirm=New-Object System.Windows.Forms.TextBox
$confirm.UseSystemPasswordChar=$true; $confirm.Location=New-Object System.Drawing.Point(25,237)
$confirm.Size=New-Object System.Drawing.Size(475,30); $form.Controls.Add($confirm)
$status=New-Object System.Windows.Forms.Label
$status.Location=New-Object System.Drawing.Point(25,285); $status.Size=New-Object System.Drawing.Size(480,45)
$form.Controls.Add($status)
$button=New-Object System.Windows.Forms.Button
$button.Text='设置为管理员'; $button.Location=New-Object System.Drawing.Point(330,342)
$button.Size=New-Object System.Drawing.Size(170,36); $form.Controls.Add($button)
$button.Add_Click({
  if ($password.Text -cne $confirm.Text) { $status.Text='两次密码不一致，请重新填写。'; return }
  if ($password.Text.Length -lt 10 -or $password.Text.Length -gt 128) { $status.Text='密码长度需为 10–128 位。'; return }
  if ($username.Text.Trim() -notmatch '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,31}$') { $status.Text='用户名格式不符合要求。'; return }
  $button.Enabled=$false; $status.Text='正在保存管理员账号，请稍候…'; $form.Refresh()
  try {
    $startInfo=New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName='node.exe'
    $startInfo.Arguments='"'+(Join-Path $PSScriptRoot 'admin.mjs')+'"'
    $startInfo.WorkingDirectory=$PSScriptRoot
    $startInfo.UseShellExecute=$false; $startInfo.CreateNoWindow=$true
    $startInfo.RedirectStandardInput=$true; $startInfo.RedirectStandardOutput=$true; $startInfo.RedirectStandardError=$true
    $startInfo.StandardOutputEncoding=New-Object System.Text.UTF8Encoding($false)
    $process=New-Object System.Diagnostics.Process
    $process.StartInfo=$startInfo; [void]$process.Start()
    $payload=@{username=$username.Text;password=$password.Text}|ConvertTo-Json -Compress
    $process.StandardInput.WriteLine($payload); $process.StandardInput.Close(); $payload=$null
    $password.Clear(); $confirm.Clear()
    $output=$process.StandardOutput.ReadToEnd(); $process.WaitForExit()
    $result=$output|ConvertFrom-Json
    if (-not $result.ok) { throw $result.error }
    $status.Text='已设置管理员：'+$result.username+'。等网站更新后即可登录。'
    $button.Text='已完成'; $username.Enabled=$false
  } catch { $status.Text='未完成：'+$_.Exception.Message; $button.Enabled=$true }
})
$form.AcceptButton=$button
[void]$form.ShowDialog()
$password.Clear(); $confirm.Clear()
