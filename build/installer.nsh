!macro customInstall
  SetOutPath $INSTDIR\Prerequisites
  MessageBox MB_YESNO "Would you like to install the driver? (This is required for Promark series only.)" /SD IDYES IDNO endCyperInstall
    ExecWait "$INSTDIR\resources\backend\CypressDriverInstaller.exe"
    Goto endCyperInstall
  endCyperInstall:
!macroend
