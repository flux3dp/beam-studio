
!macro customInstall
  ; VC++ 2015-2022 runtime (v14.x) required by Swiftray. Bundled installer is a no-op
  ; when an equal or newer runtime is present (exit 1638), so just always run it.
  ${If} ${FileExists} "$INSTDIR\resources\backend\VC_redist.x64.exe"
    ExecWait '"$INSTDIR\resources\backend\VC_redist.x64.exe" /install /passive /norestart' $R5
    ${If} $R5 == 0
    ${ElseIf} $R5 == 1638 ; newer runtime already installed
    ${ElseIf} $R5 == 3010 ; installed, reboot pending
    ${Else}
      MessageBox MB_OK "Visual C++ Redistributable install failed. Maybe you have to install manually. (Return $R5)"
    ${EndIf}
  ${EndIf}
!macroend
