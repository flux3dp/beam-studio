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
;;;
;;; Copyright (c) 2026 Paul Hsieh-Fu Tsai (蔡協孚)
;;; Contributed to FLUX Inc. and distributed under the MIT License.
;;;
;;; Permission is hereby granted, free of charge, to any person obtaining
;;; a copy of this software and associated documentation files (the
;;; "Software"), to deal in the Software without restriction, including
;;; without limitation the rights to use, copy, modify, merge, publish,
;;; distribute, sublicense, and/or sell copies of the Software, and to
;;; permit persons to whom the Software is furnished to do so, subject to
;;; the following conditions:
;;;
;;; The above copyright notice and this permission notice shall be
;;; included in all copies or substantial portions of the Software.
;;;
;;; THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
;;; EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
;;; MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
;;; IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
;;; CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
;;; TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
;;; SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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
