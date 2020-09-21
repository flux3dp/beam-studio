
!macro customInstall
  ${If} ${RunningX64}
    StrCpy $R1 "SOFTWARE\Classes\Installer\Dependencies\{d992c12e-cab2-426f-bde3-fb8c53950b0d}"
    StrCpy $R2 "$INSTDIR\resources\backend\VC_redist.x64.exe /passive"
    StrCpy $R3 "$INSTDIR\resources\backend\UsbDriver\dpinst_x64.exe /SW"
  ${Else}
    StrCpy $R1 "SOFTWARE\Classes\Installer\Dependencies\{e2803110-78b3-4664-a479-3611a381656a}"
    StrCpy $R2 "$INSTDIR\resources\backend\VC_redist.x32.exe /passive"
    StrCpy $R3 "$INSTDIR\resources\backend\UsbDriver\dpinst_x32.exe /SW"
  ${EndIf}

  ReadRegDword $R4 HKLM $R1 "DisplayName"

  ${If} $R4 == ""
    ExecWait $R2 $R5
    ${If} $R5 == 1638
    ${ElseIf} $R5 > 0
      MessageBox MB_OK "Visual C++ Redistributable install failed. Maybe you have to install manually. (Return $R5)"
    ${Else}
    ${EndIf}
  ${Else}
  ${EndIf}

  ExecWait $R3 $R5
  ${If} $R5 == 1638
  ${ElseIf} $R5 > 0
      MessageBox MB_OK "FLUX USB Link Cable driver install failed. Maybe you have to install manually. (Return $R5)"
  ${Else}
  ${EndIf}

  ; Workaround for installer handing when the app directory is removed manually
  ${ifNot} ${FileExists} "$INSTDIR"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\{${UNINSTALL_APP_KEY}}"
  ${EndIf}

  ; Workaround for the old-format uninstall registry key (some people report it causes hangups, too)
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "QuietUninstallString"
  StrCmp $0 "" proceed 0
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
  proceed:
!macroend
