;;; ------------------------------------------------------------------
;;; BeamCopy.lsp  -  "Copy to Beam Studio"
;;;
;;; Exports the selected objects to a temporary DXF and places the DXF
;;; *text* on the Windows clipboard. Switch to Beam Studio and press
;;; Ctrl+V to paste the geometry directly onto the canvas.
;;;
;;; Usage in AutoCAD:
;;;   Command: BEAMCOPY   ->  select objects  ->  Enter
;;;   (then paste in Beam Studio with Ctrl+V)
;;;
;;; Requires full AutoCAD (AutoLISP). NOT supported on AutoCAD LT.
;;; ------------------------------------------------------------------

(defun c:BEAMCOPY (/ f ss od)
  (vl-load-com)
  (princ "\nSelect objects to send to Beam Studio: ")
  (setq ss (ssget))                       ; prompt user for a selection
  (if ss
    (progn
      (setq f (strcat (getenv "TEMP") "\\beam_clip.dxf"))
      (if (findfile f) (vl-file-delete f)); avoid the "overwrite?" prompt
      (setq od (getvar "FILEDIA"))
      (setvar "FILEDIA" 0)                ; suppress the file dialog
      ;; "_O" = export Objects (the selection); trailing 16 = decimal accuracy
      (command "_.DXFOUT" f "_O" ss "" "16")
      (setvar "FILEDIA" od)
      ;; pipe the DXF text onto the Windows clipboard
      (startapp "cmd.exe" (strcat "/c clip < \"" f "\""))
      (princ "\nDXF copied to clipboard. Switch to Beam Studio and press Ctrl+V.")
    )
    (princ "\nNothing selected - cancelled.")
  )
  (princ)
)

(princ "\nBeamCopy loaded. Type BEAMCOPY to copy a selection to Beam Studio.")
(princ)
