export default {
    general: {
        wait: 'Verarbeite .. Bitte warten'
    },
    buttons: {
        next: 'NÄCHSTER'
    },
    topbar: {
        untitled: 'Ohne Titel',
        titles: {
            settings: 'Einstellungen'
        },
        zoom: 'Zoomen',
        group: 'Gruppieren',
        ungroup: 'Gruppierung aufheben',
        halign: 'Horizontal',
        valign: 'Vertikal',
        hdist: 'h. Abstand',
        vdist: 'v. Abstand',
        left_align: 'Links',
        center_align: 'Mitte',
        right_align: 'Recht',
        top_align: 'oben',
        middle_align: 'Mitte',
        bottom_align: 'Unterseite',
        union: 'Vereinigung',
        subtract: 'Differenz',
        intersect: 'Überschneidung',
        difference: 'Ausschluss',
        hflip: 'h. Spiegeln',
        vflip: 'v. Spiegeln',
        export: 'GEHEN',
        preview: 'VORSCHAU',
        borderless: '(RANDLOS)',
        tag_names: {
            rect: 'Rechteck',
            ellipse: 'Oval',
            path: 'Pfad',
            polygon: 'Vieleck',
            image: 'Bild',
            text: 'Text',
            line: 'Linie',
            g: 'Gruppe',
            multi_select: 'Mehrfachauswahl',
            use: 'Importierte Objekt',
            svg: 'SVG-Objekt',
            dxf: 'DXF-Objekt',
        },
        alerts: {
            start_preview_timeout: '#803 Beim Starten des Vorschaumodus ist eine Zeitüberschreitung aufgetreten. Bitte starten Sie Ihren Maschinen oder Beam Studio neu. Wenn dieser Fehler weiterhin besteht, befolgen Sie <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/360001111355">diese Anleitung</a>.',
            fail_to_start_preview: '#803 Fehler beim Starten des Vorschaumodus. Bitte starten Sie Ihren Maschinen oder Beam Studio neu. Wenn dieser Fehler weiterhin besteht, befolgen Sie <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/360001111355">diese Anleitung</a>.',
            power_too_high: 'Leistung zu hoch',
            power_too_high_msg: 'Die Verwendung einer niedrigeren Laserleistung (unter 70%) verlängert die Lebensdauer der Laserröhre!\nGeben Sie "OK" ein, um fortzufahren.' ,
            power_too_high_confirm: 'OK',
        },
        hint: {
            polygon: 'Press + / - key to increse / decrease sides.'
        },
    },
    support: {
        no_webgl: 'WebGL wird nicht unterstützt. Bitte verwenden Sie andere Geräte.',
        no_vcredist: 'Bitte installieren Sie Visual C ++ Redistributable 2015 <br/> Das kann auf flux3dp.com heruntergeladen werden',
        osx_10_9: 'OS X 10.9 wird nicht unterstützt. Bitte aktualisieren Sie auf eine neuere Version'
    },
    generic_error: {
        UNKNOWN_ERROR: '[UE] Bitte starte FLUX Studio neu',
        OPERATION_ERROR: '[OE] Ein Statuskonflikt ist aufgetreten. Bitte wiederholen Sie die Aktion.',
        SUBSYSTEM_ERROR: '[SE] Bitte starte die Maschine neu',
        UNKNOWN_COMMAND: '[UC] Bitte aktualisieren Sie die Delta + / Delta-Firmware',
        RESOURCE_BUSY: '[RB] Bitte starte die Maschine neu oder versuchen Sie es erneut'
    },
    device_selection: {
        no_printers: 'Kein Computer kann über das Netzwerk erkannt werden. Bitte überprüfe, ob sich Ihr PC und Ihr Gerät im selben Netzwerk befinden. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215394548">Mehr Info</a>',
        no_beambox: '#801 Wir können Ihren Computer nicht im Netzwerk finden.\nBefolgen Sie bitte <a target="_blank" href="https://support.flux3dp.com/hc/en-us/articles/360001683556">die Anleitung</a>, um das Verbindungsproblem zu beheben.',
        module: 'MODUL',
        status: 'STATUS'
    },
    update: {
        release_note: 'Veröffentlichungshinweis:',
        firmware: {
            caption: 'Ein Firmware-Update für das Gerät ist verfügbar',
            message_pattern_1: '%s ist jetzt bereit für das Firmware-Update.',
            message_pattern_2: '%s Firmware v%s ist jetzt verfügbar - Du hast v%s.',
            latest_firmware: {
                caption: 'Maschinenfirmware-Update',
                message: 'Du hast die neueste Maschinenfirmware',
                still_update: 'AKTUALISIEREN'
            },
            confirm: 'HOCHLADEN',
            upload_file: 'Firmware-Upload (* .bin / * .fxfw)',
            update_success: 'Firmware-Update erfolgreich hochgeladen',
            update_fail: '#822 Update fehlgeschlagen'
        },
        software: {
            checking: 'Suche nach Updates',
            switch_version: 'Version wechseln',
            check_update: 'Überprüfe auf Updates',
            caption: 'Ein Software-Update für Beam Studio ist verfügbar',
            downloading: 'Wenn Sie Updates im Hintergrund herunterladen, können Sie auf "OK" klicken, um Ihre Arbeit fortzusetzen.',
            install_or_not: 'ist bereit für das Update. Möchtest du jetzt neu starten und aktualisieren?',
            switch_or_not: 'ist schaltbereit. Möchtest du jetzt neu starten und wechseln?',
            message_pattern_1: 'Beam Studio ist jetzt für das Software-Update bereit.',
            message_pattern_2: 'FLUX Software v%s ist jetzt verfügbar - Du hast v%s.',
            available_update: 'Beam Studio v%s ist ab sofort verfügbar,Du hast v%s. Möchtest du das Update herunterladen?',
            available_switch: 'Beam Studio v%s ist ab sofort verfügbar,Du hast v%s. Möchtest du zu dieser Version wechseln?',
            not_found: 'Sie verwenden die neueste Version von Beam Studio.',
            no_response: 'Fehler beim Herstellen einer Verbindung zum Server. Überprüfe die Netzwerkeinstellungen.',
            switch_version_not_found: 'Wechselbare Version nicht gefunden.',
            yes: 'Ja',
            no: 'Nein',
            skip: 'Überspringe diese Version'
        },
        toolhead: {
            caption: 'Ein Firmware-Update für FLUX Werkzeugkopf ist verfügbar',
            message_pattern_1: '%s ist jetzt bereit für das Werkzeugkopf-Firmware-Update.',
            message_pattern_2: 'Die FLUX Werkzeugkopf Firmware %s ist jetzt verfügbar.',
            latest_firmware: {
                caption: 'Werkzeugkopf Firmware Update',
                message: 'Du hast die neueste Werkzeugkopf-Firmware'
            },
            confirm: 'HOCHLADEN',
            upload_file: 'Firmware-Upload (* .bin)',
            update_success: 'Werkzeugkopf Firmware-Update erfolgreich hochgeladen',
            update_fail: 'Update fehlgeschlagen',
            waiting: 'Bitte schliesse den Werkzeugkopf an'
        },
        updating: 'Aktualisierung...',
        skip: 'Überspringe diese Version',
        checkingHeadinfo: 'Überprüfen der Werkzeugkopf-Informationen',
        preparing: 'Vorbereiten...',
        later: 'SPÄTER',
        download: 'ONLINE-UPDATE',
        cannot_reach_internet: '#823 Server ist nicht erreichbar <br/> Bitte überprüfe die Internetverbindung',
        install: 'INSTALLIEREN',
        upload: 'HOCHLADEN'
    },
    topmenu: {
        version: 'Ausführung',
        ok: 'OK',
        sure_to_quit: 'Sind Sie sicher, dass Sie aufhören wollen?',
        flux: {
            label: 'FLUX',
            about: 'Über',
            preferences: 'Einstellungen',
            quit: 'Verlassen'
        },
        file: {
            label: 'Datei',
            import: 'Importieren',
            save_fcode: 'FLUX-Aufgabe exportieren',
            save_scene: 'Datei speichern',
            save_svg: 'SVG exportieren',
            save_png: 'PNG exportieren',
            save_jpg: 'JPG exportieren',
            converting: 'In Bild konvertieren ...',
            all_files: 'Alle Dateien',
            svg_files: 'SVG',
            png_files: 'PNG',
            jpg_files: 'JPG',
            bvg_files: 'Beambox-Datei',
            fcode_files: 'FLUX-Code',
            fsc_files: '3D-Druckdatei',
            confirmReset: 'Möchtest du wirklich alle Einstellungen zurücksetzen?',
            clear_recent: 'Vor kurzem geöffnet löschen',
            path_not_exit: 'Dieser Pfad scheint auf dem Schreibtisch nicht mehr zu existieren.'
        },
        edit: {
            label: 'Bearbeiten',
            duplicate: 'Duplizieren',
            rotate: 'Drehen',
            scale: 'Skalieren',
            clear: 'Datei löschen',
            undo: 'Rückgängig machen',
            alignCenter: 'Zentrieren',
            reset: 'Zurücksetzen'
        },
        device: {
            label: 'Maschinen',
            new: 'Maschineneinrichtung',
            device_monitor: 'Instrumententafel',
            device_info: 'Maschineninfo',
            head_info: 'Werkzeugkopf Info',
            change_filament: 'Druckmaterial ändern',
            default_device: 'Als Standard einstellen',
            check_firmware_update: 'Firmware aktualisieren',
            update_delta: 'Maschinenfirmware',
            update_toolhead: 'Werkzeugkopf-Firmware',
            calibrate: 'Führen Sie die automatische Nivellierung aus',
            set_to_origin: 'Ursprung kalibrieren (Home)',
            movement_tests: 'Bewegungstests ausführen',
            scan_laser_calibrate: 'Scanning Laser einschalten',
            clean_calibration: 'Führe die automatische Nivellierung mit bereinigten Daten aus',
            commands: 'Befehle',
            set_to_origin_complete: 'Die Maschine hat ihren Ursprung kalibriert.',
            scan_laser_complete: 'Das Gerät hat seinen Scanlaser eingeschaltet. Klicken Sie auf "FERTIG", um es zu deaktivieren.',
            movement_tests_complete: 'Bewegungstests abgeschlossen',
            movement_tests_failed: 'Bewegungstests fehlgeschlagen. <br/> 1. stelle sicher, dass das Werkzeugkopfkabel richtig gespannt ist. <br/> 2. stelle sicher, dass der Stecker des Werkzeugkopfkabels zur Maschine etwa zur Hälfte in die Maschine eingeführt wurde. <br/> 3. Versuchen Sie, den Anschluss am Druckwerkzeugkopf um 180 Grad zu drehen. <br/> 4. überprüfe <a target=""_blank"" href=""https://flux3dp.zendesk.com/hc/en-us/articles/115003674128""> diesen Artikel </a>.',
            download_log: 'Protokolle herunterladen',
            download_log_canceled: 'Protokoll-Download abgebrochen',
            download_log_error: 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut',
            log: {
                network: 'Netzwerk',
                hardware: 'Hardware',
                discover: 'Entdecken',
                usb: 'USB',
                usblist: 'USB-Liste',
                camera: 'Kamera',
                cloud: 'Cloud',
                player: 'Spieler',
                robot: 'Roboter'
            },
            finish: 'FERTIG',
            cancel: 'STORNIEREN',
            turn_on_head_temperature: 'Werkzeugkopftemperatur einstellen',
            network_test: 'Netzwerk testen'
        },
        window: {
            label: 'Fenster',
            minimize: 'Minimieren',
            fullscreen: 'Vollbildschirm'
        },
        help: {
            label: 'Hilfe',
            help_center: 'Hilfezentrum',
            contact: 'Kontaktiere uns',
            tutorial: 'starte das Druck-Tutorial',
            software_update: 'Software-Update',
            debug: 'Fehlerbericht',
            forum: 'Community Forum'
        },
        account: {
            label: 'Konto',
            sign_in: 'Anmelden',
            sign_out: 'Ausloggen'
        }
    },
    initialize: {
        // generic strings
        next: 'Nächster',
        start: 'Starten',
        skip: 'Überspringen',
        cancel: 'Stornieren',
        confirm: 'Bestätigen',
        connect: 'Verbinden',
        back: 'Zurück',
        retry: 'Wiederholen',
        no_machine: 'Ich habe jetzt keine Maschine.',

        // specific caption/content
        invalid_device_name: 'Der Name darf nur Chinesisch, Alphabet, Zahlen, Leerzeichen und Sonderzeichen () enthalten - _ ’\'',
        require_device_name: 'Name ist erforderlich',
        select_language: 'Sprache auswählen',
        change_password: {
            content: 'Wirklich das Passwort ändern?',
            caption: 'Passwort ändern'
        },
        connect_flux: 'schliesse die Maschine an',
        via_usb: 'USB-Kabel verwenden',
        via_wifi: 'Verwenden vom Wi-Fi',
        select_machine_type: 'Wählen Sie Ihr Modell',
        select_connection_type: 'Wie möchten Sie eine Verbindung herstellen?',
        connection_types: {
            wifi: 'Wi-Fi',
            wired: 'Kabelgebundenes Netzwerk',
            ether_to_ether: 'Direkte Verbindung',
        },
        connect_wifi: {
            title: 'Verbindung zu Wi-Fi',
            tutorial1: '1. Gehen Sie zu Touch Panel > Klicken Sie auf "Netzwerk" > "Stellen Sie eine Verbindung zu WiFi her".',
            tutorial2: '2. Wählen Sie Ihr bevorzugtes WLAN aus und verbinden Sie es.',
            what_if_1: 'Was ist, wenn ich mein WLAN nicht sehe?',
            what_if_1_content: '1. Der Wi-Fi-Verschlüsselungsmodus sollte WPA2 oder kein Kennwort sein.\n 2. Der Verschlüsselungsmodus kann in der Administrationsoberfläche des WLAN-Routers eingestellt werden. Wenn der Router WPA2 nicht unterstützt und Sie Hilfe bei der Auswahl des richtigen Routers benötigen, wenden Sie sich an den FLUX-Support.',
            what_if_2: 'Was ist, wenn ich kein WLAN sehe??',
            what_if_2_content: '1. Stellen Sie sicher, dass der Wi-Fi-Dongle vollständig angeschlossen ist.\n 2. Wenn auf dem Touchscreen keine MAC-Adresse des drahtlosen Netzwerks vorhanden ist, wenden Sie sich an den FLUX-Support.\n3. Der Wi-Fi-Kanal sollte 2.4 GHz betragen (5 GHz werden nicht unterstützt).',
        },
        connect_wired: {
            title: 'Verbindung zum kabelgebundenen Netzwerk herstellen',
            tutorial1: '1. Verbinden Sie das Gerät mit Ihrem Router.',
            tutorial2: '2. Drücken Sie "Netzwerk", um die IP des kabelgebundenen Netzwerks abzurufen.',
            what_if_1: 'Was ist, wenn die IP leer ist?',
            what_if_1_content: '1. Stellen Sie sicher, dass das Ethernet-Kabel vollständig eingesteckt ist.\n2. Wenn auf dem Touchscreen keine MAC-Adresse des kabelgebundenen Netzwerks vorhanden ist, wenden Sie sich an den FLUX-Support.',
            what_if_2: 'Was ist, wenn die IP mit 169 beginnt??',
            what_if_2_content: '1. Wenn die IP-Adresse mit 169.154 beginnt, sollte es sich um ein Problem mit der DHCP-Einstellung handeln. Wenden Sie sich an Ihren ISP (Internetdienstanbieter), um weitere Unterstützung zu erhalten.\n2. Wenn Ihr Computer über PPPoE eine direkte Verbindung zum Internet herstellt, wechseln Sie zur Verwendung des Routers, um eine Verbindung über PPPoE herzustellen, und aktivieren Sie die DHCP-Funktion im Router.'
        },
        connect_ethernet: {
            title: 'Direkte Verbindung',
            tutorial1: '1. Verbinden Sie das Gerät mit einem Ethernet-Kabel mit Ihrem Computer.',
            tutorial2_1: '2. Befolgen ',
            tutorial2_a_text: 'Sie dieser Anleitung',
            tutorial2_a_href_mac: 'https://support.flux3dp.com/hc/en-us/articles/360001517076',
            tutorial2_a_href_win: 'https://support.flux3dp.com/hc/en-us/articles/360001507715',
            tutorial2_2: ', um Ihren Computer als Router zu verwenden',
            tutorial3: '3. Klicken Sie auf "Nächster"',
        },
        connect_machine_ip: {
            enter_ip: 'Geben Sie die IP Ihres Computers ein',
            check_ip: 'Überprüfen der IP-Verfügbarkeit',
            invalid_ip: 'IP ungültig: ',
            invalid_format: 'Ungültiges Format',
            starts_with_169254: 'Beginnt mit 169.254',
            unreachable: 'IP nicht erreichbar',
            check_connection: 'Überprüfen der Maschinenverbindung',
            check_firmware: 'Firmware-Version überprüfen',
            check_camera: 'Überprüfung der Kameraverfügbarkeit',
            retry: 'Wiederholen',
            finish_setting: 'Einstellung beenden',
        },
        name_your_flux: 'Benenne deine Maschine',
        wifi_setup: 'Wi-Fi-Einrichtung',
        select_preferred_wifi: 'Wähle das bevorzugte Netzwerk.',
        requires_wifi_password: 'erfordert ein Passwort.',
        connecting: 'Anschließen...',

        set_connection: '%s Verbindungsaufbau',
        please_goto_touchpad: 'Bitte gehe zum Beambox Touchpad',
        tutorial: '1. Klicke auf dem Click-Touchpanel des Geräts auf "Netzwerk"> "WLAN-Einstellungen".\n2. Wähle dein WLAN und gebe das Passwort ein.\n3. Warte 10 Sekunden. Die WLAN-IP-Adresse wird unter "Einstellung"> "Internet" angezeigt.\n4. Wenn WLAN nicht verfügbar ist, stelle bitte eine Verbindung zum Ethernet-Port mit DHCP-fähigen Routern her.\n5. Gebe hier die Maschinen-IP ein',
        please_see_tutorial_video: 'Tutorial Video',
        tutorial_url: 'https://flux3dp.com/beambox-tutorial/',
        ip_wrong: 'IP-Format ist falsch. Bitte erneut eingeben.',

        set_machine_generic: {
            printer_name: 'Name*',
            printer_name_placeholder: 'Gebe deiner Maschine einen eindeutigen Namen',
            old_password: 'derzeitiges Passwort',
            password: 'Passwort',
            set_station_mode: 'Erstelle ein Netzwerk',
            password_placeholder: 'Sichere deinen Computer mit einem Passwort',
            incorrect_old_password: 'Falsches aktuelles Passwort',
            incorrect_password: '#828 Falsches Passwort',
            ap_mode_name: 'Netzwerkname',
            ap_mode_pass: 'Passwort',
            ap_mode_name_format: 'Akzeptiere nur Buchstaben oder Zahlen',
            ap_mode_pass_format: 'Mindestens 8 Zeichen',
            ap_mode_name_placeholder: 'Bis zu 32 Zeichen.',
            ap_mode_pass_placeholder: 'Muss mindestens 8 Zeichen haben.',
            create_network: 'Netzwerk erstellen',
            join_network: 'Anderem Netzwerk beitreten',
            security: 'Sicherheit'
        },

        setting_completed: {
            start: 'Start',
            is_ready: '“%s” ist fertig',
            station_ready_statement: 'Ihr Computer ist jetzt eine Wi-Fi-Station. Du kannst deinen Computer drahtlos verwenden, indem Du eine Verbindung zu Wi-Fi "%s" herstellst.',
            brilliant: 'Brillant!',
            begin_journey: 'Du kannst jetzt das USB / Micro-USB-Kabel ausziehen und die Reise der Kreativität kann beginnen.',
            great: 'Willkommen bei Beam Studio',
            setup_later: 'Sie können Ihren Computer jederzeit über die Titelleiste> "Maschinen"> "Maschineneinrichtung" einrichten.',
            upload_via_usb: 'Die Wi-Fi-Verbindung kann später eingerichtet werden. <br/> Wenn Du kein WLAN hast, überprüfe <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215998327-Connection-Guide-for-Desktop-PCs"> Desktop-Verbindungshandbuch </a>.',
            back: 'Zurück',
            ok: 'STARTE EIN PROJEKT'
        },

        notice_from_device: {
            headline: 'Überprüfe die WLAN-Anzeige auf deinem Computer',
            subtitle: 'Bitte beachte den Status der Wi-Fi-Verbindung.',
            light_on: 'Licht an',
            light_on_desc: 'Das Gerät hat eine Verbindung zu dem von dir zugewiesenen WLAN hergestellt',
            breathing: 'Atmung',
            breathing_desc: 'Wi-Fi-Verbindung fehlgeschlagen. Bitte versuche es erneut.',
            successfully: 'Wenn die Maschine erfolgreich verbunden wurde',
            successfully_statement: 'Gehe zurück zu der Wi-Fi-Liste, verbinde den PC mit %s und starte FLUX Studio neu',
            restart: 'Starte FLUX Studio neu'
        },

        // errors
        errors: {
            error: 'Fehler',
            close: 'schließen',
            not_found: 'Nicht gefunden',
            not_support: 'Bitte aktualisiere die Maschinenfirmware über USB auf Version 1.6 +',

            keep_connect: {
                caption: 'USB-Verbindung nicht gefunden',
                content: 'Hoppla! Mach dir keine Sorgen. Wir sind für dich da.\nVergewissere dich\n1. Die Wi-Fi-Anzeige (grüne LED) blinkt oder  leuchtet konstant.\n2. Der Treiber ist korrekt installiert. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/215327328"> (Weitere Informationen) </a>\n3. Versuche es erneut und warte 10 Sekunden.'
            },

            wifi_connection: {
                caption: 'Verbindung konnte nicht hergestellt werden',
                connecting_fail: 'Bitte stelle sicher, dass das Wi-Fi-Signal stark ist und das Passwort korrekt ist.'
            },

            select_wifi: {
                ap_mode_fail: 'Einrichtung fehlgeschlagen.'
            }
        }
    },
    wifi: {
        home: {
            line1: 'Hat es ein verfügbares Wi-Fi mit Zugang?',
            line2: 'Wir helfen Ihrem FLUX, eine Verbindung zum Wi-Fi herzustellen',
            select: 'Ja'
        },
        set_password: {
            line1: 'Bitte eingeben"',
            line2: '"Passwort des Wi-Fi-Netzwerks.',
            password_placeholder: 'Gebe hier das WLAN-Passwort ein',
            back: 'Zurück',
            join: 'Beitreten',
            connecting: 'Anschließen'
        },
        success: {
            caption: 'Großartig! Erfolgreich verbunden!',
            line1: 'Jetzt werden wir einige einfache Einstellungen für Ihre Maschine vornehmen.',
            next: 'Nächster'
        },
        failure: {
            caption: 'Verbindung nicht möglich.',
            line1: 'Bitte überprüfe, ob das WLAN ordnungsgemäß funktioniert, und stelle dann die Verbindung wieder her.',
            next: 'Schließe die Verbindung wieder an'
        },
        set_printer: {
            caption: 'Lege den Namen und das Kennwort für Ihren FLUX3D-Drucker fest.',
            printer_name: 'Name',
            printer_name_placeholder: 'Name einsetzen',
            password: 'Passwort',
            password_placeholder: 'Passwort festlegen',
            notice: 'Legen Sie das Kennwort fest, sodass nur wer das Kennwort kennt, FLUX Delta verwenden kann.',
            next: 'Nächster'
        }
    },
    menu: {
        print: 'DRUCKEN',
        laser: 'GRAVIEREN',
        scan: 'SCAN',
        usb: 'USB',
        device: 'Maschine',
        setting: 'RAHMEN',
        draw: 'ZEICHNEN',
        cut: 'SCHNITT',
        beambox: 'BEAMBOX',
        mill: 'MÜHLE',
        mm: 'mm',
        inches: 'Zoll'
    },
    settings: {
        on: 'Auf',
        off: 'aus',
        low: 'Niedrig',
        high: 'Normal',
        caption: 'die Einstellungen',
        tabs: {
            general: 'Allgemeines',
            device: 'Maschine'
        },
        ip: 'IP-Adresse des Geräts',
        guess_poke: 'Suchen Sie nach der IP-Adresse des Geräts',
        auto_connect: 'Wählen Sie automatisch die einzige Maschine aus',
        wrong_ip_format: 'Falsche IP-Formate',
        lock_selection: 'Auswahl sperren',
        default_machine: 'Standardmaschine',
        default_machine_button: 'Leeren',
        remove_default_machine_button: 'Entfernen',
        confirm_remove_default: 'Die Standardmaschine wird entfernt.',
        reset: 'Beam Studio zurücksetzen',
        reset_now: 'Beam Studio zurücksetzen',
        confirm_reset: 'Bestätige das Zurücksetzen von Beam Studio?',
        language: 'language',
        notifications: 'Desktop-Benachrichtigungen',
        check_updates: 'Auto-Check',
        updates_version: 'Versionen',
        default_app: 'Standard-App',
        default_units: 'Standardeinheiten',
        default_font_family: 'Standardschriftart',
        default_font_style: 'Standardschriftstil',
        fast_gradient: 'Geschwindigkeitsoptimierung',
        vector_speed_constraint: 'Geschwindigkeitsbegrenzung (20 mm / s)',
        loop_compensation: 'Schleifenkompensation',
        blade_radius: 'Klingenradius',
        blade_precut_switch: 'Klingenvorschnitt',
        blade_precut_position: 'Vorgeschnittene Position',
        delta_series: 'Delta Familie',
        beambox_series: 'Beambox-Familie',
        default_model: 'Standardmodell <br /> (für Druckeinstellungen)',
        default_beambox_model: 'Standarddokumenteinstellung',
        guides_origin: 'Guides Herkunft',
        guides: 'Anleitungen',
        image_downsampling: 'Bitmap-Vorschau der Qualität',
        continuous_drawing: 'Kontinuierliches Zeichnen',
        mask: 'Workarea Clipping',
        text_path_calc_optimization: 'Optimierung der Pfadberechnung',
        font_substitute: 'Ersetzen Sie nicht unterstützte Zeichen',
        default_borderless_mode: 'Open Bottom Default',
        default_enable_autofocus_module: 'Standardeinstellung für Autofokusmodul',
        default_enable_diode_module: 'Hybrid Laser Standard',
        diode_offset: 'Hybrid Laser Offset',
        none: 'Keiner',
        close: 'Schließen',
        enabled: 'Aktiviert',
        disabled: 'Behindert',
        cancel: 'Stornieren',
        done: 'Anwenden',
        groups: {
            general: 'Allgemeines',
            update: 'Software-Updates',
            connection: 'Verbindung',
            editor: 'Editor',
            engraving: 'Rastering (Scannen)',
            path: 'Vektor (Umrisse)',
            mask: 'Workarea Clipping',
            text_to_path: 'Text',
            modules: 'Hinzufügen',
        },
        connect_printer: {
            title: 'stelle eine Verbindung mit Ihrem Drucker her'
        },
        notification_on: 'Auf',
        notification_off: 'aus',
        update_latest: 'Neueste',
        update_beta: 'Beta',
        engine_change_fail: {
            'caption': 'Motor kann nicht gewechselt werden',
            '1': 'Fehler beim Prüfen',
            '2': 'Cura-Versionsfehler',
            '3': 'Weg ist nicht Cura',
            '4': 'Pfad ist keine vorhandene Datei. Bitte überprüfe den Motorpfad im Einstellungsabschnitt'
        },
        allow_tracking: 'Möchtest du anonyme Nutzungsstatistiken an FLUX senden, um die App zu verbessern?',
        flux_cloud: {
            processing: 'Wird bearbeitet...',
            flux_cloud: 'FLUX CLOUD',
            back: 'ZURÜCK',
            next: 'NÄCHSTER',
            done: 'ERLEDIGT',
            sign_in: 'ANMELDEN',
            sign_up: 'ANMELDEN',
            success: 'ERFOLG',
            fail: 'SCHEITERN',
            cancel: 'STORNIEREN',
            try_again: 'VERSUCH ES NOCH EINMAL',
            bind: 'BINDEN',
            bind_another: 'BINDEN SIE EIN ANDERES',
            username: 'Nutzername',
            nickname: 'Spitzname',
            email: 'Email',
            password: 'Passwort',
            re_enter_password: 'Kennwort erneut eingeben',
            forgot_password: 'Haben Sie Ihr Passwort vergessen?',
            sign_up_statement: 'Wenn Sie keine FLUX-ID haben, melden Sie sich bitte <a href="%s"> REGISTRIEREN </a> hier an.',
            try_sign_up_again: 'Bitte versuche es erneut mit <a href="%s"> ANMELDEN </a>',
            agreement: 'Stimme den FLUX <a href="#/studio/cloud/privacy"> Datenschutz </a>, <a href="#/studio/cloud/terms"> Allgemeinen Geschäftsbedingungen </a> zu',
            pleaseSignIn: 'Bitte melde dich mit deiner FLUX ID an',
            enter_email: 'Bitte gebe deine E-Mail-Adresse ein',
            check_inbox: 'Geh und überprüfe deinen Briefkasten!',
            error_blank_username: 'Das Feld  Spitzname darf nicht leer sein',
            error_blank_email: 'E-Mail darf nicht leer sein',
            error_email_format: 'Bitte gebe eine korrekte E-Mail-Adresse an',
            error_email_used: 'Die E-Mail-Adresse wurde verwendet',
            error_password_not_match: 'Das Passwort stimmt nicht mit dem Bestätigungspasswort überein.',
            select_to_bind: 'Wählen Sie eine Maschine zum Verbinden aus',
            binding_success: 'Deine  Maschine ist erfolgreich verbunden!',
            binding_success_description: 'Du kannst jetzt die FLUX-App verwenden, um den Maschinenstatus zu überprüfen',
            binding_fail: 'Bindung fehlgeschlagen',
            binding_fail_description: 'Kann aufgrund eines Netzwerkfehlers auftreten. Versuche es erneut',
            binding_error_description: 'Please contact support with the error log,Die Cloud-Funktion des Computers kann nicht aktiviert werden. Bitte wende dich mit dem Fehlerprotokoll an den Support',
            retrieve_error_log: 'Download Fehler',
            binding: 'Verbindung...',
            check_email: 'Bitte überprüfe deine E-Mail für Anweisungen',
            email_exists: 'Email existiert',
            not_verified: 'E-Mail wurde nicht verifiziert',
            user_not_found: 'Falsche Email oder Passwort',
            resend_verification: 'Bestätigungsmail erneut senden',
            contact_us: 'Bitte wende dich mit deiner E-Mail-Adresse und dem aufgetretenen Problem an den FLUX-Support',
            confirm_reset_password: 'Setze dein Passwort zurück?',
            format_error: 'Falsche Anmeldeinformationen',
            agree_to_terms: 'Bitte stimme den Bedingungen zu',
            back_to_list: 'Zurück zur Liste',
            change_password: 'Passwort ändern',
            current_password: 'derzeitiges Passwort',
            new_password: 'Neues Kennwort',
            confirm_password: 'Kennwort bestätigen',
            empty_password_warning: 'Passwort kann nicht leer sein',
            WRONG_OLD_PASSWORD: 'Falsches aktuelles Passwort',
            FORMAT_ERROR: 'Falsches Passwortformat',
            submit: 'SPEICHERN',
            sign_out: 'Ausloggen',
            not_supported_firmware: 'Bitte aktualisiere die Firmware Ihres Computers\nbis v1.5 + für die Cloud-Funktion',
            unbind_device: 'Möchtest du diese Maschine trennen?',
            CLOUD_SESSION_CONNECTION_ERROR: 'Der Computer kann nicht auf den Cloud-Server zugreifen. Bitte starte den Computer neu.',
            CLOUD_UNKNOWN_ERROR: 'Der Computer kann keine Verbindung zum Cloud-Server herstellen. Bitte starte den Computer neu.',
            SERVER_INTERNAL_ERROR: 'Serverinterner Fehler, versuche es später erneut.',
        }
    },
    print: {
        import: 'IMPORTIEREN',
        save: 'speichern',
        start_print: 'Drucken',
        gram: 'g',
        advanced: {
            general: 'Allgemein',
            layers: 'Ebenen',
            infill: 'ausfüllen',
            support: 'Unterstützung',
            speed: 'Geschwindigkeit',
            custom: 'Text',
            slicingEngine: 'Slicing-Motor',
            slic3r: 'Slic3r',
            cura: 'Cura',
            cura2: 'Cura2',
            filament: 'Filament',
            temperature: 'Material und Temperatur',
            detect_filament_runout: 'Filament-Erkennung',
            flux_calibration: 'Automatische Kalibrierung',
            detect_head_tilt: 'Neigungs-Erkennung',
            layer_height_title: 'Schicht-Höhe',
            layer_height: 'Schicht-Höhe',
            firstLayerHeight: 'Höhe der ersten Schicht',
            shell: 'Shell',
            shellSurface: 'Schalenoberfläche',
            solidLayerTop: 'Feste Schicht: Nach oben',
            solidLayerBottom: 'Feste Schicht: Unten',
            density: 'Dichte',
            pattern: 'Muster',
            auto: 'auto',                       // do not change
            line: 'Line',                       // do not change
            rectilinear: 'Rectilinear',         // do not change
            rectilinearGrid: 'Rectilinear Grid',// do not change
            honeycomb: 'Honeycomb',             // do not change
            offset: 'Offset',
            xyOffset: 'Horizontale Ausdehnung',
            zOffset: 'Z-Versatz',
            cutBottom: 'Unten schneiden',
            curaInfill: {
                automatic: 'Automatisch',
                grid: 'Raster',
                lines: 'Zeilen',
                concentric: 'Konzentrisch',
                concentric_3d: 'Konzentrisches 3D',
                cubic: 'Kubisch',
                cubicsubdiv: 'Kubische Unterteilung',
                tetrahedral: 'Tetraeder',
                triangles: 'Dreiecke',
                zigzag: 'Zickzack'
            },
            curaSupport: {
                lines: 'Zeilen',
                grid: 'Raster',
                zigzag: 'Zickzack'
            },
            blackMagic: 'Schwarze Magie',
            spiral: 'Spirale',
            generalSupport: 'Allgemeine Unterstützung',
            spacing: 'Linienabstand',
            overhang: 'Überhang',
            zDistance: 'Z-Abstand',
            raft: 'Floß',
            raftLayers: 'Floß-Schichten',
            brim: 'Randbreite',
            skirts: 'Röcke',
            movement: 'Bewegung',
            structure: 'Struktur',
            traveling: 'Reisen',
            surface: 'Oberfläche',
            firstLayer: 'Erste Schicht',
            solidLayers: 'Solide Schichten',
            innerShell: 'Innere Schale',
            outerShell: 'Äußere Schale',
            bridge: 'Brücke',
            config: 'Experten-Einstellungen',
            presets: 'Konfigurationen',
            name: 'Name',
            apply: 'ANTRAG',
            save: 'SPEICHERN',
            saveAsPreset: 'Konfig speichern',
            cancel: 'ABBRECHEN',
            delete: 'LÖSCHEN',
            loadPreset: 'Config laden',
            savePreset: 'Konfig speichern',
            reloadPreset: 'Konfig zurücksetzen',
            printing: 'Drucken',
            firstLayerTemperature: 'Erste Schicht',
            flexibleMaterial: 'Flexibles Material'
        },
        mode: [
            {
                value: 'Anfänger',
                label: 'Anfänger',
                checked: true
            },
            {
                value: 'Experte',
                label: 'Experte'
            }
        ],
        params: {
            beginner: {
                print_speed: {
                    text: 'Druckgeschwindigkeit',
                    options: [
                        {
                            value: 'langsam',
                            label: 'Langsam',
                            selected: true
                        },
                        {
                            value: 'schnell',
                            label: 'Schnell'
                        }
                    ]
                },
                material: {
                    text: 'Material',
                    options: [
                        {
                            value: 'pla',
                            label: 'PLA',
                            selected: true
                        }
                    ]
                },
                support: {
                    text: 'Unterstützung',
                    on: 'An',
                    off: 'Aus',
                    options: [
                        {
                            value: 'Berührend',
                            label: 'Berührend',
                            checked: true
                        },
                        {
                            value: 'nirgendwo',
                            label: 'nirgendwo'
                        }
                    ]
                },
                platform: {
                    text: 'Plattform',
                    options: [
                        {
                            value: 'Floß',
                            label: 'Floß',
                            checked: true
                        }
                    ]
                }
            },
            expert: {
                layer_height: {
                    text: 'Schicht-Höhe',
                    value: 0.3,
                    unit: 'mm'
                },
                print_speed: {
                    text: 'Druckgeschwindigkeit',
                    value: 50,
                    unit: 'mm/s'
                },
                temperature: {
                    text: 'Temperatur',
                    value: 231,
                    unit: '°C'
                },
                support: {
                    text: 'Unterstützung',
                    options: [
                        {
                            value: 'überall',
                            label: 'Überall',
                            checked: true
                        },
                        {
                            value: 'nirgendwo',
                            label: 'nirgendwo'
                        }
                    ]
                },
                platform: {
                    text: 'Plattform',
                    options: [
                        {
                            value: 'Floß',
                            label: 'Floß',
                            checked: true
                        }
                    ]
                }
            }
        },
        left_panel: {
            raft_on: 'RAFT ON',
            raft_off: 'RAFT AUS',
            support_on: 'UNTERSTÜTZUNG',
            support_off: 'UNTERSTÜTZUNG AUS',
            advanced: 'ERWEITERT',
            preview: 'VORBEREITUNG',
            plaTitle: 'DIE FARBE DES FADENS AUSWÄHLEN',
            transparent: 'TRANSPARENT',
            raftTitle: 'Flöße sind Schichten, die unter Ihren Teilen gebaut werden und ihnen helfen, an der Grundplatte zu haften.',
            supportTitle: 'Stützen sind generierte Strukturen, die überhängende Teile Ihres Objekts abstützen, um das Herabfallen von Fäden zu verhindern.',
            advancedTitle: 'Detail 3d-Druckparameter, Sie können ein besseres Ergebnis als die Standardeinstellung erzielen, indem Sie sie anpassen',
            confirmExitFcodeMode: 'Wenn Sie den Vorschaumodus verlassen, wird der FCode entladen, sind Sie sicher?'
        },
        right_panel: {
            get: 'Hole',
            go: 'Gehe',
            preview: 'Vorschau'
        },
        quality: {
            high: 'HOHE QUALITÄT',
            med: 'MITTLERE QUALITÄT',
            low: 'NIEDRIGE QUALITÄT',
            custom: 'ZOLLQUALITÄT'
        },
        model: {
            fd1: 'DELTA',
            fd1p: 'DELTA+'
        },
        scale: 'SKALIEREN',
        rotate: 'DREHEN',
        delete: 'löschen',
        reset: 'Zurücksetzen',
        cancel: 'ABBRECHEN',
        done: 'ERLEDIGT',
        pause: 'PAUSE',
        restart: 'NEUSTART',
        download_prompt: 'bitte Dateiname eingeben',
        importTitle: '3D-Modelle importieren ( .stl )',
        getFcodeTitle: 'Werkzeukopf-Pfad und Konfiguration in FCode-Datei ( *.fc ) speichern',
        goTitle: 'Vorbereiten zum Drucken',
        deviceTitle: 'Maschinenmonitor anzeigen',
        rendering: 'Slicing',
        reRendering: 'Neu-Slicing',
        finishingUp: 'Abschliessen...',
        savingFilePreview: 'Dateivorschau speichern',
        uploading: 'Hochladen zum Schneidemotor',
        uploaded: 'Hochgeladen, Slicing-Engine verarbeitet...',
        importingModel: 'Modell importieren',
        wait: 'Bitte warte...',
        out_of_range: 'Außerhalb des Bereichs',
        out_of_range_message: 'verkleinere bitte die Größe des Objekts/der Objekte',
        drawingPreview: 'Zeichnungsvorschau-Pfad, bitte warten',
        gettingSlicingReport: 'Erhalten des Slicing-Status'
    },
    draw: {
        pen_up: 'Bewegliche Höhe',
        pen_down: 'Zeichnungshöhe',
        speed: 'Geschwindigkeit',
        pen_up_title: 'Die Höhe, in der Ihr Stift die Zeichenfläche nicht berührt',
        pen_down_title: 'Die Höhe, in der Ihr Stift mit der Zeichenfläche in Kontakt kommt, muss niedriger sein als die bewegliche Höhe',
        speed_title: 'Die Zeichnungsgeschwindigkeit',
        units: {
            mms: 'mm/s',
            mm: 'mm'
        }
    },
    cut: {
        horizontal_calibrate: 'Horizontal\nAnpassung',
        height_calibrate: 'Höhe\nAnpassung',
        running_horizontal_adjustment: 'Horizontale Anpassung ausführen...',
        running_height_adjustment: 'Laufende Höhenanpassung...',
        run_height_adjustment: 'Bitte stelle das Blatt ein und führe die Höheneinstellung durch.',
        horizontal_adjustment_completed: 'Horizontale Anpassung abgeschlossen',
        height_adjustment_completed: 'Höhenanpassung abgeschlossen',
        you_can_now_cut: 'Herzlichen Glückwunsch! Du kannst jetzt mit dem Schneiden der Blätter beginnen.',
        zOffset: 'Höhenversatz',
        overcut: 'Überschnitt',
        speed: 'Geschwindigkeit',
        bladeRadius: 'Radius der Klinge',
        backlash: 'Spielausgleich',
        zOffsetTip: 'Stelle die Schnitthöhe für dickeres Vinyl ein oder um zu verhindern, dass zu hart oder zu leicht geschnitten wird',
        overcutTip: 'Überschnittene Schlaufen zum leichteren Abziehen',
        speedTip: 'Die Schnittgeschwindigkeit',
        backlashTip: 'Passe den Wert an, wenn die geraden Linien bei Verwendung der Klinge eines Drittanbieters nicht gerade genug sind.',
        units: {
            mms: 'mm/s',
            mm: 'mm'
        }
    },
    mill: {
        calibrate: 'Auto\nEbene',
        zOffset: 'Schnitthöhe',
        overcut: 'Überschnitt',
        speed: 'Geschwindigkeit',
        repeat: 'Wiederhole',
        stepHeight: 'Stufenhöhe',
        backlash: 'Spielausgleich',
        zOffsetTip: 'Einstellung der Schnitthöhe für dickeres Vinyl und zur Vermeidung von zu hartem oder zu leichtem Schneiden',
        overcutTip: 'Überschnittene Schlaufen zum leichteren Abziehen',
        speedTip: 'Die Schnittgeschwindigkeit',
        backlashTip: 'Passe den Wert an, wenn gerade Linien nicht gerade genug sind',
        units: {
            mms: 'mm/s',
            mm: 'mm'
        }
    },
    laser: {
        import: 'IMPORT',
        save: 'Speichern',
        custom: 'Benutzerdefiniert',
        presets: 'Config laden',
        button_advanced: 'ERWEITERT',
        confirm: 'Bestätigen Sie',
        get_fcode: 'Speichern<br/>Aufgabe',
        export_fcode: 'Als Datei speichern ...',
        name: 'Name',
        go: 'GO',
        showOutline: 'Sicht\nRahmen',
        do_calibrate: 'Es scheint, dass Sie die Gravur zum ersten Mal verwenden, Sie können die Kraftkarte in der Packung verwenden, um die beste Brennweite zu finden. Möchtest du das Kalibrierungsbild laden? Sie können es auch später unter "Erweitert" laden.',
        process_caption: 'erzeugen',
        laser_accepted_images: 'Unterstützte Formate: BMP/GIF/JPG/PNG/SVG',
        draw_accepted_images: 'Unterstützte Formate: SVG',
        svg_fail_messages: {
            'TEXT_TAG': 'SVG-Tag &lt;text&gt; wird nicht unterstützt',
            'DEFS_TAG': 'SVG-Tag &lt;defs&gt; wird nicht unterstützt',
            'CLIP_TAG': 'SVG-Tag &lt;clip&gt; wird nicht unterstützt',
            'FILTER_TAG': 'SVG-Tag &lt;filter&gt; wird nicht unterstützt',
            'EMPTY': 'ist eine leere Datei',
            'FAIL_PARSING': 'beim Parsing-Prozess fehlgeschlagen',
            'SVG_BROKEN': 'war gebrochen',
            'NOT_SUPPORT': 'Diese Datei ist keine SVG-Datei'
        },
        title: {
            material: 'Wähle ein geeignetes Material, um das beste Gravurergebnis zu erzielen.',
            object_height: 'Objekthöhe gemessen von der Grundplatte bis zur maximalen Höhe des Objekts',
            height_offset: 'Einstellen der z-Position für beste Laserfokussierung',
            shading: 'Die Schattierung ermöglicht den Gradienten-Effekt der Lasergravur. Es dauert länger.',
            advanced: 'Benutzerdefinierte Einstellungen für Leistung und Geschwindigkeit.'
        },
        print_params: {
            object_height: {
                text: 'OBJEKTHÖHE',
                unit: 'mm'
            },
            height_offset: {
                text: 'FOKUS-VERSATZ',
                unit: 'mm'
            },
            shading: {
                text: 'SCHATTIERUNG',
                textOn: 'AN',
                textOff: 'AUS',
                checked: true
            }
        },
        object_params: {
            position: {
                text: 'STANDPUNKT'
            },
            size: {
                text: 'GRÖSSE',
                unit: {
                    width: 'W',
                    height: 'H'
                }
            },
            rotate: {
                text: 'DREHEN'
            },
            threshold: {
                text: 'SCHWELLENWERT',
                default: 128
            }
        },
        advanced: {
            label: 'Einrichtung',
            form: {
                object_options: {
                    text: 'WERKSTOFFE',
                    label: 'Objekt-Optionen',
                    options: [
                        {
                            value: 'Pappe',
                            label: 'Kraftpapier',
                            data: {
                                laser_speed: 10,
                                power: 255
                            }
                        },
                        {
                            value: 'Holz',
                            label: 'HOLZ',
                            data: {
                                laser_speed: 3,
                                power: 255
                            }
                        },
                        {
                            value: 'Leder',
                            label: 'LEDER',
                            data: {
                                laser_speed: 5,
                                power: 255
                            }
                        },
                        {
                            value: 'Papier',
                            label: 'PAPIER',
                            data: {
                                laser_speed: 2,
                                power: 255
                            }
                        },
                        {
                            value: 'Kork',
                            label: 'KORK',
                            data: {
                                laser_speed: 5,
                                power: 255
                            }
                        },
                        {
                            value: 'andere',
                            label: 'SONSTIGES',
                            data: {}
                        }
                    ]
                },
                laser_speed: {
                    text: 'Laser-Geschwindigkeit',
                    unit: 'mm/s',
                    fast: 'Schnell',
                    slow: 'Langsam',
                    min: 0.8,
                    max: 20,
                    step: 0.1
                },
                power: {
                    text: 'Leistung',
                    high: 'Hoch',
                    low: 'Niedrig',
                    min: 0,
                    max: 255,
                    step: 1
                }
            },
            save_and_apply: 'SPEICHERN & ANWENDEN',
            save_as_preset: 'SPEICHERN',
            save_as_preset_title: 'Konfig speichern',
            load_preset_title: 'Config laden',
            background: 'Hintergrund',
            removeBackground: 'Hintergrund entfernen',
            removePreset: 'ausgewählte Voreinstellung wird überarbeitet',
            load_calibrate_image: 'Kalibrierungsbild laden',
            apply: 'ANTRAG',
            cancel: 'ABBRECHEN',
            save: 'SPEICHERN'
        }
    },
    scan: {
        stop_scan: 'Halt',
        over_quota: 'Überquote',
        convert_to_stl: 'Konvertieren',
        scan_again: 'Erneut scannen',
        start_multiscan: 'Extra-Scan',
        processing: 'Verarbeitung...',
        remaining_time: 'Links',
        do_save: 'STL speichern',
        go: 'Gehen Sie',
        rollback: 'Zurück',
        error: 'Fehler',
        confirm: 'Bestätigen Sie',
        caution: 'Vorsicht',
        cancel: 'Abbrechen',
        delete_mesh: 'Löschen?',
        quality: 'QUALITÄT',
        scan_again_confirm: 'Möchtest du das aktuelle Scan-Ergebnis verwerfen?',
        calibrate: 'Kalibriere',
        calibration_done: {
            caption: 'Kalibrierung abgeschlossen',
            message: 'Du kannst jetzt scannen'
        },
        cant_undo: 'Kann nicht rückgängig gemacht werden',
        estimating: 'Ich schätze die Zeit...',
        calibrate_fail: 'Kalibrierung fehlgeschlagen',
        calibration_is_running: 'Kalibrieren für Scannen',
        calibration_firmware_requirement: 'Bitte aktualisiere Ihre Firmware auf 1.6.9+',
        resolution: [{
            id: 'am besten',
            text: 'Beste',
            time: '~30min',
            value: 1200
        },
        {
            id: 'hoch',
            text: 'Hoch',
            time: '~20min',
            value: 800
        },
        {
            id: 'normal',
            text: 'Normal',
            time: '~10min',
            value: 400
        },
        {
            id: 'niedrig',
            text: 'Niedrig',
            time: '~5min',
            value: 200
        },
        {
            id: 'Entwurf',
            text: 'Entwurf',
            time: '~2min',
            value: 100
        }],
        save_mode: [
            {
                value: 'stl',
                label: 'STL',
                checked: true
            },
            {
                value: 'pcd',
                label: 'PCD'
            },
        ],
        manipulation: {
            filter: 'FILTER',
            position: 'STANDPUNKT',
            size: 'GRÖSSE',
            rotate: 'DREHEN',
            crop: 'Ausschneiden',
            manual_merge: 'Zusammenführen',
            clear_noise: 'Denoise',
            save_pointcloud: 'Exportieren'
        },
        size: {
            x: 'X',
            y: 'Y',
            z: 'Z'
        },
        rotate: {
            x: 'X',
            y: 'Y',
            z: 'Z'
        },
        translate: {
            x: 'X',
            y: 'Y',
            z: 'Z'
        },
        messages: {
            'not open': {
                caption: 'Kamera nicht erkannt / Zu dunkel',
                message: 'Bitte nehmen Sie die Abtastkamera ab, bis sie am Ende ein Geräusch macht.'
            },
            'no object': {
                caption: 'Kalibrierwerkzeug nicht erkannt',
                message: 'Führe das Kalibrierungswerkzeug in den mittleren Schlitz ein und stelle sicher, dass eine ausreichende Beleuchtung vorhanden ist.'
            },
            'no laser': {
                caption: 'Abtastlaser nicht erkannt',
                message: 'Drücke auf die Laserköpfe, um sie zu öffnen, und achte darauf, dass die Beleuchtung nicht zu stark ist.'
            }
        }
    },
    beambox: {
        tag:{
            g: 'Gruppe',
            use: 'SVG importieren',
            image: 'Bild',
            text: 'Text'
        },
        toolbox: {
            ALIGN_LEFT: 'Links ausrichten',
            ALIGN_RIGHT: 'Rechts ausrichten',
            ALIGN_TOP: 'Oben ausrichten',
            ALIGN_BOTTOM: 'Unten ausrichten',
            ALIGN_CENTER: 'Zentrum ausrichten',
            ALIGN_MIDDLE: 'Ausrichten Mitte',
            ARRANGE_HORIZON: 'Horizontal anordnen',
            ARRANGE_VERTICAL: 'Vertikal anordnen',
            ARRANGE_DIAGONAL: 'Diagonal anordnen'
        },
        popup: {
            select_favor_input_device: 'Bessere Benutzererfahrung wurde optimiert<br/>Bitte wählen Sie Ihr bevorzugtes Eingabegerät.',
            select_import_method: 'Wählen Sie den Layering-Stil:',
            touchpad: 'TouchPad',
            mouse: 'TouchPad',
            layer_by_layer: 'Schicht',
            layer_by_color: 'Farbe',
            nolayer: 'Einzelne Schicht',
            loading_image: 'Bild laden, bitte warten...',
            no_support_text: 'Beam Studio unterstützt derzeit keine Text-Tags. Bitte übertrage Text vor dem Importieren in den Pfad.',
            speed_too_high_lower_the_quality: 'Die Verwendung einer zu hohen Geschwindigkeit bei dieser Auflösung kann zu einer geringeren Qualität der Gravur führen.',
            both_power_and_speed_too_high: 'Die Verwendung einer niedrigeren Laserleistung verlängert die Lebensdauer der Laserröhre!\nAußerdem kann eine zu hohe Geschwindigkeit bei dieser Auflösung zu einer schlechteren Qualität der Gravur führen.',
            too_fast_for_path: 'Die Verwendung einer zu hohen Geschwindigkeit in Ebenen mit Pfadobjekten, kann zu einer geringeren Präzision beim Schneiden führen.\nWir empfehlen, beim Schneiden keine Geschwindigkeit von mehr als 20 mm/s zu verwenden.',
            too_fast_for_path_and_constrain: 'Folgende Ebenen: %s\nenthalten Vektorpfadobjekte und eine Geschwindigkeit von mehr als 20 mm/s \nDie Schnittgeschwindigkeit von Vektorpfadobjekten wird auf 20 mm/s reduziert.\nDu kannst diese Beschränkung unter Präferenzen-Einstellungen entfernen.',
            should_update_firmware_to_continue: '#814 Deine Firmware unterstützt diese Version von Beam Studio nicht. Bitte aktualisiere die Firmware, um fortzufahren. (Menü > Maschine > [Ihre Maschine] > Firmware aktualisieren)',
            more_than_two_object: 'Zu viele Objekte. Es werden nur 2 Objekte unterstützt.',
            not_support_object_type: 'Objekttyp wird nicht unterstützt.',
            select_first: 'Wähle zunächst ein Objekt aus.',
            select_at_least_two: 'Wähle zwei Objekte zum Fortfahren aus.',
            import_file_contain_invalid_path: '#808 Importierte SVG-Datei enthält ungültigen Bildpfad. Bitte stelle sicher, dass alle Bilddateien existieren oder betten Sie das Bild in die Datei',
            import_file_error_ask_for_upload: 'Importierte SVG-Datei konnte nicht importiert werden. Bist du bereit, dem Entwicklerteam eine Datei für den Fehlerbericht zur Verfügung zu stellen ?',
            upload_file_too_large: '#819 Datei ist zu groß zum Hochladen.',
            successfully_uploaded: 'Datei-Upload erfolgreich.',
            upload_failed: '#819 Datei-Upload fehlgeschlagen.',
            or_turn_off_borderless_mode: ' Oder deaktivieren Sie den Open Bottom Modus.',
            svg_1_1_waring: 'Die Version dieser SVG-Datei ist Version 1.1. Möglicherweise treten Inkompatibilitätsprobleme auf.',
            svg_image_path_waring: 'Diese SVG-Datei enthält das Laden von <image> aus dem Dateipfad. Dies kann beim Laden zu Fehlern führen.\nUm dieses Risiko zu vermeiden, verwenden Sie beim Exportieren von SVG bitte das eingebettete Bild.',
            dxf_version_waring: 'Die Version dieser DXF-Datei ist nicht 2013, möglicherweise treten Inkompatibilitätsprobleme auf.',
            dont_show_again: 'Nicht mehr anzeigen',
            convert_to_path_fail: 'Konvertierung in Pfad fehlgeschlagen.',
            save_unsave_changed: 'Nicht gespeicherte Änderungen speichern?',
            dxf_bounding_box_size_over: 'Die Zeichnungsgröße ist außerhalb des Arbeitsbereichs. Bewege bitte deine Zeichnung näher an den Ursprung in Ihrer CAD-Software oder stelle sicher, dass das Gerät richtig eingestellt ist.',
            progress: {
                uploading: 'Hochladen'
            },
            backend_connect_failed_ask_to_upload: '#802 Beim Versuch, eine Verbindung zum Server herzustellen, treten immer wieder Fehler auf. Möchtest du Ihr Fehlerberichtsprotokoll hochladen?',
            pdf2svg: {
                error_when_converting_pdf: '#824 Fehler beim Konvertieren von PDF in SVG:',
                error_pdf2svg_not_found: '#825 Fehler: Befehl pdf2svg nicht gefunden. Bitte installieren Sie pdf2svg mit Ihrem Paketmanager (z. B. "yum install pdf2svg" oder "apt-get install pdf2svg").',
            },
            ungroup_use: 'Dadurch wird die Gruppierung von importiertem DXF oder SVG aufgehoben. Da die Datei möglicherweise eine große Anzahl von Elementen enthält, kann das Aufheben der Gruppierung einige Zeit dauern. Sind Sie sicher, fortzufahren?',
            vectorize_shading_image: 'Das Vektorisieren von Schattierungsbildern dauert länger und ist anfällig für Rauschen. Bitte schalten Sie die Bildschattierung aus, bevor Sie sie ausführen.',
        },
        zoom_block: {
            fit_to_window: 'An Fenster anpassen',
        },
        left_panel: {
            insert_object: 'Objekt einfügen',
            preview: 'Vorschau',
            borderless: '(Randlos)',
            advanced: 'Erweitert',
            image_trace: 'Bild verfolgen',
            suggest_calibrate_camera_first: 'Bitte kalibriere die Kamera. (Menü> Maschine> [Ihre Maschine]> Kamera kalibrieren)\nRichte die Plattform jedes Mal neu aus, wenn du sie verwendest, um ein besseres Vorschauergebnis zu erzielen.',
            end_preview: 'Vorschaumodus beenden',
            unpreviewable_area: 'Blinder Bereich',
            diode_blind_area: 'Hybrid Laser Add-On Blindbereich',
            borderless_blind_area: 'Nicht gravierender Bereich',
            borderless_preview: 'Kamera-Vorschau im randlosen Modus',
            rectangle: 'Rechteck',
            ellipse: 'Ellipse',
            line: 'Linie',
            image: 'Bild',
            text: 'Text',
            label: {
                cursor: 'Wählen',
                photo: 'Bild',
                text: 'Text',
                line: 'Linie',
                rect: 'Rechteck',
                oval: 'Oval',
                polygon: 'Vieleck',
                pen: 'Stift',
                array: 'Anordnung',
                preview: 'Kameravorschau',
                trace: 'Bild verfolgen',
                clear_preview: 'Vorschau löschen'
            },
            insert_object_submenu: {
                rectangle: 'Rechteck',
                ellipse: 'Ellipse',
                line: 'Linie',
                image: 'Bild',
                text: 'Text',
                path: 'Pfad',
                polygon: 'Vieleck'
            },
        },
        right_panel: {
            tabs: {
                layers: 'Layers',
                objects: 'Objects',
                path_edit: 'Pfadbearbeitung',
            },
            layer_panel: {
                layer1: 'Schicht 1',
                layer_bitmap: 'Bitmap',
                layer_engraving: 'Gravur',
                layer_cutting: 'Schneiden',
                move_elems_to: 'Verschiebe ausgewählte Objekte:',
                notification: {
                    dupeLayerName: 'TEine Ebene hat bereits diesen Namen',
                    newName: 'NEUER NAME',
                    enterUniqueLayerName: 'Verwenden Sie einen eindeutigen Namen für die Ebene',
                    enterNewLayerName: 'Geben Sie bitte einen neuen Namen für die Ebene ein',
                    layerHasThatName: 'Eine Ebene hat bereits diesen Namen',
                    QmoveElemsToLayer: 'Verschiebe ausgewählte Objekte in die Ebene \'%s\'?',
                },
                layers: {
                    layer: 'Ebene',
                    layers: 'Ebenen',
                    del: 'Ebene löschen',
                    move_down: 'Ebene nach unten verschieben',
                    new: 'Neue Ebene',
                    rename: 'Ebene umbenennen',
                    move_up: 'Ebene nach oben verschieben',
                    dupe: 'Ebene duplizieren',
                    lock: 'Ebene sperren',
                    merge_down: 'Nach unten zusammenführen',
                    merge_all: 'Alle zusammenführen',
                    move_elems_to: 'Verschiebe ausgewählte Objekte:',
                    move_selected: 'Verschiebe ausgewählte Objekte auf eine andere Ebene',
                },
            },
            laser_panel: {
                parameters: 'Parameter',
                strength: 'Leistung',
                speed: 'Geschwindigkeit',
                repeat: 'Ausführen',
                focus_adjustment: 'Fokuseinstellung',
                height: 'Objekthöhe',
                z_step: 'Z Schritt',
                diode: 'Diodenlaser',
                times: 'mal',
                cut: 'Schnitt',
                engrave: 'Gravieren',
                more: 'Verwalten',
                delete: 'Löschen',
                reset: 'Zurücksetzen',
                sure_to_reset: 'Dadurch werden alle Voreinstellungen zurückgesetzt und Ihre benutzerdefinierten Konfigurationen werden beibehalten. Sind Sie sicher, dass Sie fortfahren?',
                apply: 'Anwenden',
                cancel: 'Stornieren',
                save: 'Speichern',
                save_and_exit: 'Speichern und schließen',
                name: 'Name',
                default: 'Standard',
                customized: 'Kundenspezifische Liste',
                inuse: 'in Benutzung',
                export_config: 'Parameter exportieren',
                new_config_name: 'Neuer Parametername',
                sure_to_load_config: 'Dadurch wird die Anordnung der Voreinstellungen geladen und die in der Datei festgelegten benutzerdefinierten Parameter ersetzt. Sind Sie sicher, dass Sie fortfahren?',
                dropdown: {
                    mm: {
                        wood_3mm_cutting: 'Holz - 3mm Schneiden',
                        wood_5mm_cutting: 'Holz - 5mm Schneiden',
                        wood_engraving: 'Holz - Gravur',
                        acrylic_3mm_cutting: 'Acryl - 3mm Schneiden',
                        acrylic_5mm_cutting: 'Acryl - 5mm Schneiden',
                        acrylic_engraving: 'Acryl - Gravur',
                        leather_3mm_cutting: 'Leder - 3mm Schneiden',
                        leather_5mm_cutting: 'Leder - 5mm Schneiden',
                        leather_engraving: 'Leder - Gravur',
                        fabric_3mm_cutting: 'Stoff - 3mm Schneiden',
                        fabric_5mm_cutting: 'Stoff - 5mm Schneiden',
                        fabric_engraving: 'Stoff - Gravur',
                        rubber_bw_engraving: 'Gummi - Gravur',
                        glass_bw_engraving:  'Glas - Gravur',
                        metal_bw_engraving: 'Metall - Gravur',
                        stainless_steel_bw_engraving_diode: 'Metall - Gravur (Diodenlaser)',
                        save: 'Aktuelle Parameter hinzufügen',
                        export: 'Export',
                        import: 'Importieren',
                        more: 'Verwalten',
                        parameters: 'Voreinstellungen'
                    },
                    inches: {
                        wood_3mm_cutting: 'Holz - 0.1\'\' Schneiden',
                        wood_5mm_cutting: 'Holz - 0.2\'\' Schneiden',
                        wood_engraving: 'Holz - Gravur',
                        acrylic_3mm_cutting: 'Acryl- 0.1\'\' Schneiden',
                        acrylic_5mm_cutting: 'Acryl- 0.2\'\' Schneiden',
                        acrylic_engraving: 'Acryl - Gravur',
                        leather_3mm_cutting: 'Leder - 0.1\'\' Schneiden',
                        leather_5mm_cutting: 'Leder - 0.2\'\' Schneiden',
                        leather_engraving: 'Leder - Gravur',
                        fabric_3mm_cutting: 'Stoff - 0.1\'\' Schneiden',
                        fabric_5mm_cutting: 'Stoff - 0.2\'\' Schneiden',
                        fabric_engraving: 'Stoff - Gravur',
                        rubber_bw_engraving: 'Gummi - Gravur',
                        glass_bw_engraving:  'Glas - Gravur',
                        metal_bw_engraving: 'Metall - Gravur',
                        stainless_steel_bw_engraving_diode: 'Metall - Gravur (Diodenlaser)',
                        save: 'Aktuelle Parameter hinzufügen',
                        export: 'Export',
                        import: 'Importieren',
                        more: 'Verwalten',
                        parameters: 'Voreinstellungen'
                    },
                },
                laser_speed: {
                    text: 'Lasergeschwindigkeit',
                    unit: 'mm/s',
                    fast: 'Schnell',
                    slow: 'Langsam',
                    min: 3,
                    max: 300,
                    step: 0.1
                },
                power: {
                    text: 'Leistung',
                    high: 'Hoch',
                    low: 'Niedrig',
                    min: 1,
                    max: 100,
                    step: 0.1
                },
                para_in_use: 'Dieser Parameter wird verwendet.',
                do_not_adjust_default_para: 'Standardparameter kann nicht angepasst werden.',
                existing_name: 'Dieser Parametername wurde verwendet.'
            },
            object_panel: {
                zoom: 'Zoomen',
                group: 'Gruppieren',
                ungroup: 'Gruppierung aufheben',
                hdist: 'Horizontal Abstand',
                vdist: 'Vertikal Abstand',
                left_align: 'Links ausrichten',
                center_align: 'Zentrum ausrichten',
                right_align: 'Rechts ausrichten',
                top_align: 'Oben ausrichten',
                middle_align: 'Ausrichten Mitte',
                bottom_align: 'Unten ausrichten',
                union: 'Vereinigung',
                subtract: 'Differenz',
                intersect: 'Überschneidung',
                difference: 'Ausschluss',
                hflip: 'Horizontal Spiegeln',
                vflip: 'Vertical Spiegeln',
                option_panel: {
                    fill: 'Füllen',
                    rounded_corner: 'Gerundete Ecke',
                    font_family: 'Schriftart',
                    font_style: 'Style',
                    font_size: 'Stil',
                    letter_spacing: 'Buchstaben-Abstand',
                    line_spacing: 'Zeilenabstand',
                    vertical_text: 'Vertikaler Text',
                    shading: 'Schattierung',
                    threshold: 'Schwellenhelligkeit',
                },
                actions_panel: {
                    replace_with: 'Ersetzen mit...',
                    trace: 'Verfolgen',
                    grading: 'Benotung',
                    sharpen: 'Schärfen',
                    crop: 'Ernte',
                    bevel: 'Fase',
                    invert: 'Farbe umkehren',
                    convert_to_path: 'In Pfad konvertieren',
                    wait_for_parsing_font: 'Schriftart analysieren ... Bitte warten.',
                    offset: 'Offset',
                    array: 'Anordnung',
                    decompose_path: 'Zerlegen',
                    disassemble_use: 'Zerlegen',
                    disassembling: 'Zerlegen ...',
                    ungrouping: 'Gruppierung aufheben...',
                },
                path_edit_panel: {
                    node_type: 'Knotentyp',
                },
            },
        },
        bottom_right_panel: {
            convert_text_to_path_before_export: 'Text in Pfad konvertieren ...',
            retreive_image_data: 'Bilddaten abrufen ...',
            export_file_error_ask_for_upload: 'Aufgabe konnte nicht exportiert werden. Bist du bereit, eine Arbeitsszene für die Entwicklung eines Teams für Fehlerberichte bereitzustellen?',
        },
        image_trace_panel: {
            apply: 'Anwenden',
            back: 'Zurück',
            cancel: 'Stornieren',
            next: 'Nächster',
            brightness: 'Helligkeit',
            contrast: 'Kontrast',
            threshold: 'Schwellenwert',
            okay: 'okay',
            tuning: 'Parameter'
        },
        photo_edit_panel: {
            apply: 'Anwenden',
            back: 'Zurück',
            cancel: 'Stornieren',
            next: 'Nächster',
            sharpen: 'Schärfen',
            sharpness: 'Schärfe',
            crop: 'Ernte',
            curve: 'Kurve',
            start: 'Start',
            processing: 'wird bearbeitet',
            invert: 'Farbe umkehren',
            okay: 'okay',
            phote_edit: 'Fotobearbeitung'
        },
        document_panel: {
            document_settings: 'Dokumenteinstellungen',
            engrave_parameters: 'Gravurparameter',
            workarea: 'Arbeitsbereich',
            rotary_mode: 'Drehtisch',
            borderless_mode: 'Öffnen Sie den Boden',
            engrave_dpi: 'Auflösung',
            enable_diode: 'Hybrid-Laser',
            enable_autofocus: 'Autofokus',
            add_on: 'Hinzufügen',
            low: 'Niedrig',
            medium: 'Mittel',
            high: 'Hoch',
            ultra: 'Ultra Hoch',
            enable: 'Aktivieren',
            disable: 'Deaktivieren',
            cancel: 'Stornieren',
            save: 'Speichern'
        },
        object_panels: {
            position: 'Position',
            rotation: 'Drehung',
            size: 'Größe',
            width: 'Breite',
            height: 'Höhe',
            center: 'Mittel',
            ellipse_radius: 'Größe',
            rounded_corner: 'Gerundete Ecke',
            radius: 'Radius',
            points: 'Punkte',
            length: 'Länge',
            text: 'Text',
            font_size: 'Größe',
            fill: 'Füllen',
            letter_spacing: 'Buchstaben-Abstand',
            line_spacing: 'Zeilenabstand',
            vertical_text: 'Vertical Text',
            convert_to_path: 'In Pfad konvertieren',
            convert_to_path_to_get_precise_result: 'Einige Schriftarten können nicht korrekt analysiert werden. Bitte konvertiere Text in Pfad, bevor du ihn an Beambox senden',
            wait_for_parsing_font: 'Schriftart analysieren ... Bitte warten.',
            text_to_path: {
                font_substitute_pop: 'Text: "%s" enthält folgende Zeichen, die von der aktuellen Schriftart nicht unterstützt werden: "%s".\n%s\nMöchtest du "%s" als Ersatz verwenden?',
                check_thumbnail_warning: 'Einige Texte wurden beim Verwandeln von Texten in Pfade in andere Schriftarten geändert, und einige Zeichen werden möglicherweise nicht normal konvertiert.\nBitte überprüfe das Vorschaubild erneut, bevor du die Aufgabe sendest.'
            },
            laser_config: 'Laserkonfiguration',
            shading: 'Schattierung',
            threshold: 'Schwellenwert',
            lock_desc: 'Behalte das Verhältnis von Breite und Höhe bei (UMSCHALTTASTE)'
        },
        tool_panels:{
            cancel: 'Stornieren',
            confirm: 'Bestätigen',
            grid_array: 'Grid Array erstellen',
            array_dimension: 'Array-Dimension',
            rows: 'Zeilen',
            columns: 'Spalten',
            array_interval: 'Array-Intervall',
            dx: 'X',
            dy: 'Y',
            offset: 'Offset',
            nest: 'Arrangement-Optimierung',
            _offset: {
                direction: 'Versatzrichtung',
                inward: 'Innere',
                outward: 'Nach außen',
                dist: 'Versetzte Entfernung',
                corner_type: 'Ecke',
                sharp: 'Scharf',
                round: 'Runden',
                fail_message: 'Fehler beim Versetzen von Objekten.',
                not_support_message: 'Ausgewählte Elemente mit nicht unterstütztem SVG-Tag:\n&lt;image&gt;, &lt;g&gt;, &lt;text&gt;, &lt;use&gt;\nDiese Objekte werden übersprungen.',
            },
            _nest: {
                start_nest: 'Ordnen',
                stop_nest: 'Halt',
                end: 'Schließen',
                spacing: 'Abstand',
                rotations: 'Mögliche Drehung',
                no_element: 'Es ist kein Element zu arrangieren.',
            }
        },
        network_testing_panel: {
            network_testing: 'Netzwerktests',
            local_ip: 'Lokale IP-Adresse:',
            insert_ip: 'IP-Adresse des Zielgeräts:',
            empty_ip: '#818 Bitte gebe zuerst die IP des Zielgeräts ein.',
            start: 'Start',
            end: 'Ende',
            testing: 'Netzwerk testen ...',
            invalid_ip: '#818 ungültige IP-Adresse',
            ip_startswith_169: '#843 Die IP-Adresse des Geräts beginnt mit 169.254',
            connection_quality: 'Verbindungsqualität',
            average_response: 'Durchschnittliche Reaktionszeit',
            test_completed: 'Test abgeschlossen',
            test_fail: 'Im Test durchgefallen',
            cannot_connect_1: '#840 Verbindung zur Ziel-IP fehlgeschlagen.',
            cannot_connect_2: '#840 Verbindung zur Ziel-IP fehlgeschlagen. Stelle sicher, dass sich das Ziel im selben Netzwerk befindet.',
            network_unhealthy: '#841 Verbindungsqualität < 70 oder durchschnittliche Antwortzeit > 100ms',
            device_not_on_list: '#842 Das Gerät ist nicht in der Liste aufgeführt, aber der Verbindungsqualität beträgt > 70 und die durchschnittliche Antwortzeit < 100ms',
            hint_device_often_on_list: 'Die Maschine ist oft nicht auf der Liste gefunden?',
            link_device_often_on_list: 'https://support.flux3dp.com/hc/en-us/articles/360001841636',
            hint_connect_failed_when_sending_job: 'Verbindung beim Senden eines Auftrags fehlgeschlagen?',
            link_connect_failed_when_sending_job: 'https://support.flux3dp.com/hc/en-us/articles/360001841656',
            hint_connect_camera_timeout: 'Zeitüberschreitung beim Starten der Kameravorschau?',
            link_connect_camera_timeout: 'https://support.flux3dp.com/hc/en-us/articles/360001791895',
            cannot_get_local: 'Der Zugriff auf die lokale IP-Adresse ist fehlgeschlagen.',
            fail_to_start_network_test: '#817 Starte den Netzwerktest nicht.'
        },
        layer_color_config_panel: {
            layer_color_config: 'Ebenenfarbkonfigurationen',
            color: 'Farbe',
            power: 'Leistung',
            speed: 'Geschwindigkeit',
            repeat: 'Ausführen',
            add: 'Hinzufügen',
            save: 'Speichern',
            cancel: 'Stornieren',
            default: 'Zurücksetzen',
            add_config: 'Farbe hinzufügen',
            in_use: 'Diese Farbe wird verwendet.',
            no_input: 'Bitte gebe einen gültigen Hex-Farbcode ein.',
            sure_to_reset: 'Du verlierst alle benutzerdefinierten Parameter. Bist du sicher, dass du die Standardeinstellungen wiederherzustellen?',
            sure_to_delete: 'Bist du sicher, diese Farbeinstellung zu löschen?'
        },
        svg_editor: {
            unnsupported_file_type: 'Der Dateityp wird nicht direkt unterstützt. Bitte konvertiere die Datei in SVG oder Bitmap.',
            unnsupport_ai_file_directly: 'Bitte konvertiere zuerst die AI-Datei in SVG oder Bitmap.',
            unable_to_fetch_clipboard_img: 'Bild konnte nicht aus der Zwischenablage abgerufen werden',
        },
        units: {
            walt: 'W',
            mm: 'mm'
        }
    },
    select_printer: {
        choose_printer: 'Wählen Sie eine Maschine',
        notification: '%s erfordert ein Passwort',
        submit: 'EINREICHEN',
        please_enter_password: 'Passwort',
        auth_failure: '#811 Authentifizierung fehlgeschlagen',
        retry: 'Wiederholen',
        unable_to_connect: '#810 Es kann keine stabile Verbindung zur Maschine hergestellt werden'
    },
    device: {
        pause: 'Pause',
        paused: 'Pause',
        pausing: 'Pause',
        select_printer: 'Wähle Drucker',
        retry: 'Wiederholen',
        status: 'Status',
        busy: 'Beschäftigt',
        ready: 'Bereit',
        reset: 'Zurücksetzen (Kick)',
        abort: 'Abbrechen',
        start: 'Start',
        please_wait: 'Bitte warten...',
        quit: 'Verlassen',
        heating: 'Heizung',
        completing: 'Abschliessen',
        aborted: 'Abgebrochen',
        completed: 'Abgeschlossen',
        calibrating: 'Kalibrieren',
        showOutline: 'Rahmen zeigt',
        aborting: 'Abbruch',
        starting: 'Beginnend',
        preparing: 'Vorbereiten',
        resuming: 'Wiederaufnahme',
        scanning: 'am Scannen',
        occupied: 'in Wartung',
        running: 'am Arbeiten',
        uploading: 'am Hochladen',
        processing: 'wird bearbeitet',
        disconnectedError: {
            caption: 'Maschine nicht angeschlossen',
            message: 'Bitte bestätige, ob ein Netzwerkzugriff von %s verfügbar ist'
        },
        noTask: 'Derzeit sind keine Aufgaben zu erledigen',
        pleaseWait: 'Bitte warten...',
        finishing: 'Fertigstellung',
        initiating: 'Initiieren',
        unknown: 'Unbekannt',
        pausedFromError: 'Wegen Fehler angehalten',
        model_name: 'Modellname',
        IP: 'IP',
        serial_number: 'Seriennummer',
        firmware_version: 'Firmware Version',
        UUID: 'UUID',
        select: 'Wählen',
        deviceList: 'Maschinenliste',
        calibration: {
            title: 'Automatische Kalibrierung',
            A: 'Nivellierung & Höhe',
            H: 'Nur Höhe',
            N: 'aus',
            byFile: 'Nach Datei'
        },
        detectFilament: {
            title: 'Filamenterkennung',
            on: 'An',
            off: 'aus',
            byFile: 'Nach Datei'
        },
        filterHeadError: {
            title: 'Werkzeugkopf-Fehlererkennung',
            shake: 'Shake',
            tilt: 'Neigung',
            fan_failure: 'Lüfterdefekt',
            laser_down: 'Laser Interlock',
            byFile: 'Nach Datei',
            no: 'Nein'
        },
        autoresume: {
            title: 'Fortsetzung der intelligenten Aufgabe',
            on: 'Auf',
            off: 'aus'
        },
        broadcast: {
            title: 'UPNP-Übertragung',
            L: 'Standard',
            A: 'Aktiv',
            N: 'Nein'
        },
        enableCloud: {
            title: 'Cloud aktivieren',
            A: 'Aktiv',
            N: 'Nein'
        },
        backlash: 'Geometrische Fehlerkorrektur',
        turn_on_head_temperature: 'Werkzeugkopftemperatur einstellen',
        plus_camera: 'Upgrade Kits Kamera',
        plus_extrusion: 'Upgrade-Kits Extruder',
        postback_url: 'Status-Rückruf-URL',
        movement_test: 'Bewegungstest vor dem Drucken',
        machine_radius: 'Delta Radius',
        disable: 'Deaktivieren',
        enable: 'Aktivieren',
        beambox_should_use_touch_panel_to_adjust: 'Die Beambox-Einstellungen sollten über das Beambox-Touchpanel angepasst werden.'
    },
    monitor: {
        change_filament                     : 'FILAMENT ÄNDERN',
        browse_file                         : 'DATEI DURCHSUCHEN',
        monitor                             : 'MONITOR',
        currentTemperature                  : 'Aktuelle Temp',
        nothingToPrint                      : 'Es gibt nichts zu drucken',
        go                                  : 'Start',
        start                               : 'Start',
        pause                               : 'Pause',
        stop                                : 'Halt',
        record                              : 'Aufzeichnung',
        camera                              : 'Kamera',
        connecting                          : 'Verbindung wird hergestellt. Bitte warten...',
        HEAD_OFFLINE                        : '#110 Werkzeugkopf nicht erkannt\nstelle sicher, dass das Werkzeugkopf-Kabel korrekt angeschlossen ist <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183157"> Weitere Informationen </a>',
        HEAD_ERROR_CALIBRATING              : '#112 Der interne Kreisel des Werkzeugkopfs kann nicht kalibriert werden\nBitte bringen Sie den Werkzeugkopf wieder an',
        HEAD_ERROR_FAN_FAILURE              : '#113 Lüfter ausgefallen\nBitte drehen Sie den Ventilator mit einem Bleistift oder einem dünnen Stab. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217732178"> Weitere Informationen </a>',
        HEAD_ERROR_HEAD_OFFLINE             : '#110 Werkzeugkopf nicht erkannt\nstelle sicher, dass das Werkzeugkopf-Kabel korrekt angeschlossen ist <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183157"> Weitere Informationen </a>',
        HEAD_ERROR_TYPE_ERROR               : '#111 Werkzeugkopf falsch \nBitte bringen Sie den richtigen Werkzeugkopf an',
        HEAD_ERROR_INTLK_TRIG               : '#116 Neigung des Gravurwerkzeugkopfs erkannt \nBitte stelle sicher, dass die Stangen richtig angeschlossen sind. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217085937"> Weitere Informationen </a>',
        HEAD_ERROR_RESET                    : '#114 Werkzeugkopf schlechte Verbindung\nstelle sicher, dass der Werkzeugkopf korrekt angeschlossen ist. Wenden Sie sich an den Support, wenn dieser Fehler zweimal in einem Ausdruck auftritt. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218183167" > Weitere Informationen </a>',
        HEAD_ERROR_TILT                     : '#162 Werkzeugkopfneigung erkannt\nBitte überprüfe, ob die Kugelgelenkstange richtig angebracht ist',
        HEAD_ERROR_SHAKE                    : '#162 Werkzeugkopfneigung erkannt\nBitte überprüfe, ob die Kugelgelenkstange richtig angebracht ist',
        HEAD_ERROR_HARDWARE_FAILURE         : '#164 Anormale Temperatur des Werkzeugkopfs erkannt\nBitte wenden Sie sich an den FLUX-Support <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218415378"> Weitere Informationen </a>',
        'HEAD_ERROR_?'                      : '#199 Werkzeugkopf-Fehler \nüberprüfe, ob der Werkzeugkopf abnormal ist',
        HARDWARE_ERROR_FILAMENT_RUNOUT      : '#121 Filament nicht erkannt \nBitte fügen Sie neues Material <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757"> Weitere Informationen </a> ein',
        HARDWARE_ERROR_0                    : '#121 Filament nicht erkannt \nBitte fügen Sie neues Material <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757"> Weitere Informationen </a> ein',
        HARDWARE_ERROR_PLATE_MISSING        : '#122 Die Grundplatte kann nicht erkannt werden\nBitte auf den Teller legen.',
        HARDWARE_ERROR_ZPROBE_ERROR         : '#123 Die Grundplatte kann nicht kalibriert werden\nBitte entfernen Sie mögliche Hindernisse (Reste auf der Düse oder der Platte) <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931767"> Weitere Informationen </a>',
        HARDWARE_ERROR_CONVERGENCE_FAILED   : '#123 Die Grundplatte kann nicht kalibriert werden\nBitte entfernen Sie mögliche Hindernisse (Reste auf der Düse oder der Platte) <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931767"> Weitere Informationen </a>',
        HARDWARE_ERROR_HOME_FAILED          : '#124 Ursprung kann nicht kalibriert werden (home)\nBitte entfernen Sie Hindernisse an den Schienen und stelle sicher, dass die Werkzeugkopfkabel nicht von den Wagen erfasst werden.',
        HARDWARE_ERROR_MAINBOARD_ERROR      : '#401 Kritischer Fehler: Mainboard offline. Bitte wenden Sie sich an den FLUX Support.',
        HARDWARE_ERROR_SUBSYSTEM_ERROR      : '#402 Kritischer Fehler: Subsystem keine Antwort. Bitte wenden Sie sich an den FLUX Support',
        HARDWARE_ERROR_SENSOR_ERROR         : 'Hardware-Sensorfehler, wenden Sie sich bitte an den FLUX-Support. ~',
        HARDWARE_ERROR_SENSOR_ERROR_FSR     : 'Drucksensor ausgefallen',
        HARDWARE_ERROR_PUMP_ERROR           : '#900 Bitte erkundigen Sie sich bei Ihrem Wassertank.',
        HARDWARE_ERROR_DOOR_OPENED          : '#901 schliesse die Tür, um fortzufahren.',
        HARDWARE_ERROR_OVER_TEMPERATURE     : '#902 Überhitzt. Bitte warten Sie einige Minuten.',
        USER_OPERATION_ROTARY_PAUSE         : 'Bitte wechseln Sie zum Rotationsmotor',
        WRONG_HEAD                          : 'Werkzeugkopf ist unbekannt, bitte verbinden Sie sich mit einem korrekten Werkzeugkopf',
        USER_OPERATION                      : 'Die Maschine wird vom (anderen) Benutzer bedient',
        RESOURCE_BUSY                       : 'Die Maschine ist beschäftigt\nWenn es nicht läuft, starte den Computer neu',
        DEVICE_ERROR                        : 'Etwas ist schief gelaufen\nBitte starte die Maschine neu',
        NO_RESPONSE                         : 'Etwas ist schief gelaufen\nBitte starte die Maschine neu',
        SUBSYSTEM_ERROR                     : '#402 Kritischer Fehler: Subsystem keine Antwort. Bitte wenden Sie sich an den FLUX Support.',
        HARDWARE_FAILURE                    : 'Etwas ist schief gelaufen\nBitte starte die Maschine neu',
        MAINBOARD_OFFLINE                   : 'Etwas ist schief gelaufen\nBitte starte die Maschine neu',
        G28_FAILED                          : '#124 Ursprung kann nicht kalibriert werden (home)\nBitte entfernen Sie Hindernisse an den Schienen und stelle sicher, dass die Werkzeugkopfkabel nicht von den Wagen erfasst werden.',
        FILAMENT_RUNOUT_0                   : '#121 Das Filament ist ausgegangen\nBitte fügen Sie neues Material <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218931757"> Weitere Informationen </a> ein',
        USER_OPERATION_FROM_CODE            : 'Betriebspause (Filamentwechsel)',
        processing                          : 'wird bearbeitet',
        savingPreview                       : 'Beispiele generieren',
        hour                                : 'h',
        minute                              : 'm',
        second                              : 's',
        left                                : 'übrig',
        temperature                         : 'Temperatur',
        forceStop                           : 'Möchtest du die laufende Aufgabe abbrechen?',
        upload                              : 'Hochladen',
        download                            : 'herunterladen',
        relocate                            : 'Umziehen',
        cancel                              : 'Abbrechen',
        prepareRelocate                     : 'Vorbereitung für den Umzug',
        fileNotDownloadable                 : 'Dieser Dateityp wird für den Download nicht unterstützt.',
        cannotPreview                       : 'Vorschau dieses Dateiformats nicht möglich',
        extensionNotSupported               : 'Dieses Dateiformat wird nicht unterstützt.',
        fileExistContinue                   : 'Datei existiert bereits, möchten Sie sie ersetzen?',
        confirmGToF                         : 'Der GCode wird in FCode umgewandelt, möchten Sie fortfahren? ( wird ersetzt, falls vorhanden )',
        updatePrintPresetSetting            : 'LUX Studio has new default printing parameters, do you want to update?","FLUX Studio hat neue Standarddruckparameter, möchten Sie diese aktualisieren?\n( Aktuelle Einstellungen werden überschrieben )',
        confirmFileDelete                   : 'Sind Sie sicher, dass Sie diese Datei löschen möchten?',
        task: {
            EXTRUDER                        : 'Drucken',
            PRINT                           : 'Drucken',
            LASER                           : 'Laser-Gravur',
            DRAW                            : 'Digitale Zeichnung',
            CUT                             : 'Schneiden von Vinyl',
            VINYL                           : 'Schneiden von Vinyl',
            BEAMBOX                         : 'Laser-Gravur',
            'N/A'                           : 'Freier Modus'
        },
        device: {
            EXTRUDER                        : 'Druck-Werkzeugkopf',
            LASER                           : 'Gravur-Werkzeugkopf',
            DRAW                            : 'Zeichnungs-Werkzeugkopf'
        },
        cant_get_toolhead_version           : 'Informationen zum Werkzeugkopf können nicht abgerufen werden'
    },
    alert: {
        caption: 'Fehler',
        duplicated_preset_name: 'Duplizierter Voreinstellungsname',
        info: 'INFO',
        warning: 'WARNUNG',
        error: 'UH-OH',
        oops: 'Hoppla...',
        retry: 'Wiederhole',
        abort: 'Abbrechen',
        confirm: 'Bestätige',
        cancel: 'Abbrechen',
        close: 'schließen',
        ok: 'OK',
        ok2: 'OK',
        yes: 'Ja',
        no: 'Nein',
        stop: 'Halt',
        save: 'Speichern',
        dont_save: 'Nicht speichern'
    },
    caption: {
        connectionTimeout: 'Verbindungs-Timeout'
    },
    message: {
        connecting: 'Verbinden...',
        connectingMachine: 'Verbinden von %s...',
        tryingToConenctMachine: 'Versuch, eine Verbindung zur Maschine herzustellen...',
        connected: 'Verbunden',
        authenticating: 'Authentifizierung...',
        runningTests: 'Ausführen von Tests...',
        machineNotConnected: 'Maschine ist nicht angeschlossen',
        notPrinting: 'Der Druck ist nicht im Gange',
        nothingToPrint: 'Nichts zu drucken (Quell-Blob fehlt)',
        connectionTimeout: '#805 Bitte überprüfe den Zustand Ihres Netzwerks und die Wi-Fi-Anzeige Ihres Geräts.',
        device_not_found: {
            caption: 'Standard-Maschine nicht gefunden',
            message: '#812 Bitte überprüfe die Wi-Fi-Anzeige Ihres Geräts'
        },
        device_busy: {
            caption: 'Maschine beschäftigt',
            message: 'Die Maschine führt eine andere Aufgabe aus, versuchen Sie es später noch einmal. Wenn sie nicht mehr funktioniert, starte die Maschine bitte neu.'
        },
        device_is_used: 'Die Maschine wird benutzt, möchten Sie die aktuelle Aufgabe abbrechen?',
        device_in_use: 'Die Maschine wird benutzt, bitte halten Sie die laufende Aufgabe an oder unterbrechen Sie sie.',
        invalidFile: 'Die Datei ist keine gültige STL-Datei.',
        failGeneratingPreview: 'Vorschau kann nicht generiert werden',
        slicingFailed: 'slic3r ist nicht in der Lage, dieses Modell zu schneiden',
        no_password: {
            content: 'Maschinenkennwort über USB einrichten, um die Verbindung für diesen Computer zu ermöglichen',
            caption: 'Passwort nicht gesetzt'
        },
        image_is_too_small: 'Die Datei enthält nicht unterstützte Informationen',
        monitor_too_old: {
            caption: 'Veraltete Firmware',
            content: '#814 Bitte installieren Sie die neueste Firmware mit <a target="_blank" href="http://helpcenter.flux3dp.com/hc/en-us/articles/216251077">dieser Anleitung</a>.'
        },
        cant_establish_connection: 'Die Verbindung mit der FLUX Studio API ist nicht möglich. Bitte <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/requests/new" target=""_blank"">kontaktieren Sie die FLUX-Unterstützung.</a>.',
        application_occurs_error: 'Die Anwendung ist auf einen unbehandelten Fehler gestoßen.',
        error_log: 'Fehlerprotokoll',
        fcodeForLaser: 'Dies ist ein FCode für die Gravur',
        fcodeForPen: 'Dies ist ein FCode für das Zeichnen',
        confirmFCodeImport: 'Wenn Sie FCode importieren, werden alle Objekte auf der Szene entfernt, sind Sie sicher?',
        confirmSceneImport: 'Wenn Sie .fsc importieren, werden alle Objekte in der Szene entfernt, sind Sie sicher?',
        brokenFcode: '%s kann nicht geöffnet werden',
        slicingFatalError: 'Beim Slicen aufgetretener Fehler. Bitte melden Sie die STL-Datei an den Kundensupport.',
        unknown_error: '#821 Die Anwendung ist auf einen unbekannten Fehler gestoßen, bitte benutzen Sie Hilfe > Menü > Fehlerbericht.',
        unknown_device: '#826 Die Verbindung zum Gerät kann nicht hergestellt werden, Bitte stelle sicher, dass USB an das Gerät angeschlossen ist.',
        important_update: {
            caption: 'Wichtiges Update',
            message: 'Wichtig Firmware-Update der Maschine ist verfügbar. Möchtest du jetzt aktualisieren?',
        },
        unsupport_osx_version: 'Die aktuelle MacOS-Version X %s unterstützt möglicherweise einige Funktionen nicht. Bitte aktualisieren Sie auf die neueste Version.',
        unsupport_win_version: 'Die aktuelle Betriebssystemversion %s unterstützt möglicherweise einige Funktionen nicht. Bitte aktualisieren Sie auf die neueste Version.',
        need_password: 'Benötigen Passwort für die Verbindung mit der Maschine',
        unavailableWorkarea: '#804 Der aktuelle Arbeitsbereich übersteigt den Arbeitsbereich dieser Maschine. Bitte überprüfe den Arbeitsbereich des ausgewählten Geräts oder stelle den Arbeitsbereich über Bearbeiten > Dokumenteinstellung ein.',
        new_app_downloading: 'FLUX Studio wird heruntergeladen',
        new_app_download_canceled: 'Der Download von FLUX Studio wurde abgebrochen',
        new_app_downloaded: 'Neuestes FLUX Studio wurde heruntergeladen',
        ask_for_upgrade: 'Möchtest du jetzt upgraden?',
        please_enter_dpi: 'Bitte geben Sie die Einheit Ihrer Datei ein',
        auth_error: '#820 Auth-Fehler: Bitte aktualisieren Sie Beam Studio und die Firmware des Computers auf die neueste Version.',
        gcode_area_too_big: 'Der importierte GCode überschreitet den druckbaren Bereich.',
        empty_file: 'Datei ist leer',
        usb_unplugged: 'Die USB-Verbindung ist verloren gegangen. Bitte überprüfe Ihre USB-Verbindung',
        launghing_from_installer_warning: 'Wenn Sie FLUX Studio aus dem Installationsprogramm heraus starten, kann dies zu Problemen führen. Bitte verschieben Sie FLUX Studio in den Anwendungsordner.',
        uploading_fcode: 'FCode hochladen',
        cant_connect_to_device: '#827 Das Gerät konnte nicht angeschlossen werden, bitte überprüfe Ihre Verbindung',
        unable_to_find_machine: 'Maschine konnte nicht gefunden werden',
        disconnected: 'Verbindung instabil, Bitte überprüfe die Geräteverbindung und versuche es später erneut',
        unable_to_start: '#830 Die Aufgabe konnte nicht gestartet werden. Bitte versuchen Sie es erneut. Wenn dies erneut geschieht, kontaktieren Sie uns bitte mit einem Fehlerbericht:\n',
        camera_fail_to_transmit_image: 'Bei der Bildübertragung ist ein Fehler aufgetreten. Bitte starte Ihre Beambox neu oder kontaktieren Sie uns.'
    },
    machine_status: {
        '-10': 'Modus beibehalten',
        '-2': 'Scannen',
        '-1': 'Aufrechterhaltung',
        0: 'Bereit',
        1: 'Initiieren',
        2: 'ST_TRANSFORM',
        4: 'Beginnend',
        6: 'Wiederaufnahme',
        16: 'Arbeiten',
        18: 'Wiederaufnahme',
        32: 'Pause',
        36: 'Pause',
        38: 'Pause',
        48: 'Pause',
        50: 'Pause',
        64: 'Abgeschlossen',
        66: 'Abschluss',
        68: 'Vorbereiten',
        128: 'Abgebrochen',
        UNKNOWN: 'Unbekannt'
    },
    head_module: {
        EXTRUDER: 'Drucken',
        LASER: 'Laser',
        UNKNOWN: '',
        error: {
            'missing': 'Fehlerinformationen fehlen',
            '0': 'Unbekanntes Modul',
            '1': 'Sensorkommunikationsfehler',
            '2': 'Nein hallo', // pi will send head_error_reset before this is issued
            '3': '#112 Der interne Kreisel des Werkzeugkopfs kann nicht kalibriert werden\nPlease re-attach the toolhead,Bitte bringen Sie den Werkzeugkopf wieder an',
            '4': '#162 Werkzeugkopfneigung erkannt\nBitte überprüfe, ob die Kugelgelenkstange richtig angebracht ist',
            '5': '#162 Werkzeugkopfneigung erkannt\nBitte überprüfe, ob die Kugelgelenkstange richtig angebracht ist',
            '6': '#119 Der Werkzeugkopf des Druckers kann die Temperatur nicht steuern. Bitte wenden Sie sich an den FLUX Support.',
            '7': '#113 Lüfter ausgefallen\nBitte drehen Sie den Ventilator mit einem Bleistift oder einem dünnen Stab. <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/217732178"> Weitere Informationen </a>',
            '8': '#116 Neigung des Gravurwerkzeugkopfs erkannt\nBitte stelle sicher, dass die Stangen richtig angeschlossen sind. <a target=_blank href=https://flux3dp.zendesk.com/hc/en-us/articles/217085937> Weitere Informationen </a>',
            '9': '#118 Drucker-Werkzeugkopf kann nicht erwärmt werden\nBitte wende sich an den FLUX Support.'
        }
    },
    change_filament: {
        home_caption: 'Filament wechseln',
        load_filament_caption: 'LADET',
        load_flexible_filament_caption: 'LADET FLEXIBEL',
        unload_filament_caption: 'ENTLADEN',
        cancel: 'STORNIEREN',
        load_filament: 'Filament laden',
        load_flexible_filament: 'Flexibles Filament laden',
        unload_filament: 'Filament entladen',
        next: 'NÄCHSTER',
        heating_nozzle: 'Heizdüse',
        unloading: 'Filament entladen',
        loaded: 'Filament geladen',
        unloaded: 'Filament entladen',
        ok: 'OK',
        kicked: 'Wurde getreten',
        auto_emerging: 'Bitte Filament einlegen',
        loading_filament: 'Filament laden',
        maintain_head_type_error: 'Werkzeugkopf nicht richtig installiert',
        disconnected: 'Verbindung instabil, Bitte überprüfe die Geräteverbindung und versuche es später erneut',
        maintain_zombie: 'Bitte starte die Maschine neu',
        toolhead_no_response: '#117 Modul keine Antwort <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/218347477"> Mehr </a>',
        NA: 'Werkzeugkopf ist nicht angeschlossen'
    },
    head_temperature: {
        title: 'Werkzeugkopftemperatur einstellen',
        done: 'FERTIG',
        target_temperature: 'Zieltemperatur',
        current_temperature: 'Aktuelle Temperatur',
        set: 'einstellen',
        incorrect_toolhead: 'Falscher Werkzeugkopf, bitte Druckwerkzeugkopf verwenden',
        attach_toolhead: 'Bitte schliesse den Druckwerkzeugkopf an'
    },
    camera_calibration: {
        update_firmware_msg1: 'Ihre Firmware unterstützt diese Funktion nicht. Bitte aktualisieren Sie die Firmware auf v',
        update_firmware_msg2: 'oder höher, um fortzufahren。 (Menü> Maschine> [Ihre Maschine]> Firmware aktualisieren)',
        camera_calibration: 'Kamerakalibrierung',
        next: 'NÄCHSTER',
        cancel: 'STORNIEREN',
        back: 'ZURÜCK',
        finish: 'ERLEDIGT',
        please_goto_beambox_first: 'Bitte wechsle in den Gravurmodus (Beambox), um diese Funktion nutzen zu können.',
        please_place_paper: {
            beambox: 'Bitte lege ein weißes Papier im A4- oder Letter-Format in die linke obere Ecke des Arbeitsbereichs',
            beamo: 'Bitte lege ein weißes Papier im A4- oder Letter-Format in die linke obere Ecke des Arbeitsbereichs',
        },
        please_refocus: {
            beambox: 'Stelle die Plattform bitte auf den Brennpunkt ein (die Höhe des umgedrehten Acryls).',
            beamo: 'Stelle den Laserkopf bitte so ein, dass er auf das Gravurobjekt fokussiert (Höhe des umgedrehten Acryls).'
        },
        dx: 'X',
        dy: 'Y',
        rotation_angle: 'Drehung',
        x_ratio: 'X-Verhältnis',
        y_ratio: 'Y-Verhältnis',
        show_last_config: 'Letztes Ergebnis anzeigen',
        hide_last_config: 'Letztes Ergebnis ausblenden',
        taking_picture: 'Foto machen...',
        start_engrave: 'STARTE ENGRAVE',
        analyze_result_fail: 'Konnte das aufgenommene Bild nichtanalysieren. <br/> Bitte stelle Folgendes sicher: <br/>1. Das aufgenommene Bild ist vollständig mit weißem Papier bedeckt.<br/>2. Die Plattform ist richtig fokussiert.',
        no_lines_detected: 'Linien aus dem aufgenommenen Bild können nicht erkannt werden. <br/> Bitte stelle Folgendes sicher: <br/>1. Das aufgenommene Bild ist vollständig mit weißem Papier bedeckt.<br/>2. Die Plattform ist richtig fokussiert.',
        drawing_calibration_image: 'Kalibrierungsbild zeichnen ...',
        please_confirm_image: '<div><div class="img-center" style="background:url(%s)"></div></div>Bitte stelle Folgendes sicher:<br/>1. Das aufgenommene Bild ist vollständig mit weißem Papier bedeckt.<br/>2. Die Plattform ist richtig fokussiert.',
        calibrate_done: 'Kalibrierung abgeschlossen. Eine bessere Kameragenauigkeit ist gegeben, wenn genau fokussiert wird.',
        hint_red_square: 'Bitte richte das rote Quadrat mit dem ausgeschnittenen Quadrat aus',
        hint_adjust_parameters: 'Verwende diese Parameter, um das rote Quadrat anzupassen'
    },
    diode_calibration: {
        update_firmware_msg1: 'Ihre Firmware unterstützt diese Funktion nicht. Bitte aktualisieren Sie die Firmware auf v',
        update_firmware_msg2: 'oder höher, um fortzufahren。 (Menü> Maschine> [Ihre Maschine]> Firmware aktualisieren)',
        diode_calibration: 'Kalibrierung des Hybrid-Lasermodul',
        next: 'NÄCHSTER',
        cancel: 'STORNIEREN',
        back: 'ZURÜCK',
        start_engrave: 'STARTE ENGRAVE',
        finish: 'DONE',
        please_do_camera_calibration_and_focus: {
            beambox: 'Beim Kalibrieren von Hybrid-Lasermodul wird eine Kamera benötigt\nBitte stelle sicher, dass die Kamera dieser Maschine kalibriert wurde.\nUnd stelle bitte die Plattform auf den Brennpunkt ein (die Höhe des umgedrehten Acryls).',
            beamo: 'Beim Kalibrieren von Hybrid-Lasermodul wird eine Kamera benötigt.\nBitte stelle sicher, dass die Kamera dieser Maschine kalibriert wurde.\nUnd stelle bitte den Laserkopf so ein, dass er auf das Gravurobjekt fokussiert ist (die Höhe des umgedrehten Acryls).'
        },
        please_place_paper: {
            beambox: 'Bitte lege ein weißes Papier im Format A4 oder Letter in die linke obere Ecke des Arbeitsbereichs',
            beamo: 'Bitte lege ein weißes Papier im Format A4 oder Letter in die linke obere Ecke des Arbeitsbereichs',
        },
        dx: 'X',
        dy: 'Y',
        drawing_calibration_image: 'Zeichnen eines Kalibrierungsbildes...',
        taking_picture: 'Foto machen...',
        calibrate_done: 'Kalibrierung durchgeführt. Offset des Diodenmoduls wurde gespeichert.',
        hint_red_square: 'Bitte das rote Quadrat mit dem ausgeschnittenen Quadrat ausrichten',
        hint_adjust_parameters: 'Verwende diese Parameter zur Einstellung des roten Quadrats'
    },
    input_machine_password: {
        require_password: '%s erfordert ein Passwort',
        connect: 'VERBINDEN',
        password: 'Passwort'
    },
    set_default: {
        success: 'Erfolgreiches Setzen von %s als Standard',
        error: 'Kann %s aufgrund von Netzwerkproblemen nicht als Standard festlegen'
    },
    tutorial: {
        set_first_default_caption: 'WILLKOMMEN',
        set_first_default: 'Möchtest du "%s" als Ihr Standardgerät festlegen?',
        startWithFilament: 'Jetzt laden wir den Glühfaden',
        startWithModel: 'Als nächstes importieren wir ein Beispiel-3D-Modell',
        startTour: 'Willkommen!<br/>Dies ist das erste Mal, dass du druckst,<br/>Willst du mit dem Drucken der Anleitung beginnen?',
        clickToImport: 'Klicke hier, um ein Beispiel-3D-Modell zu importieren',
        selectQuality: 'Wähle die von dir bevorzugte Qualität',
        clickGo: 'Vorbereiten zum Drucken',
        startPrint: 'Trage Leim auf die Platte ohne Raster auf, warten, bis sie getrocknet ist, dann sind sie druckfertig.',
        skip: 'Überspringen',
        startPrintDeltaPlus: 'Stelle sicher, dass du die magnetische Druckplatte auflegen.',
        runningMovementTests: 'Laufende Bewegungstests',
        connectingMachine: 'Anschließen an das Gerät',
        movementTestFailed: { caption: 'Unfähig, Bewegungstests zu bestehen',  message: '1. Vergewissern Sie sich, dass das Werkzeugkopfkabel richtig gestreckt ist.<br/>2. Vergewissern Sie sich, dass der Stecker des Werkzeugkopfkabels zur Maschine etwa zur Hälfte in die Maschine eingesteckt ist.<br/>3. Versuchen Sie, den Stecker am Druckwerkzeugkopf um 180 Grad zu drehen.<br/>4. überprüfe <a target="_blank" href="https://flux3dp.zendesk.com/hc/en-us/articles/115003674128">diesen Artikel</a>.<br/> Versuchen Sie es noch einmal?' },
        befaultTutorialWelcome: 'Vielen Dank, dass du FLUX Delta+ bestellt hast!<br/><br/> Dieser Leitfaden führt dich durch die Grundeinstellungen des Geräts und hilft dir bei der Einrichtung.<br/><br/> Sehen wir uns das Tutorial an! Bitte schalte die Untertitel ein.<br/><br/>',
        openBrowser: 'öffnenBrowser',
        welcome: 'WILLKOMMEN',
        needNewUserTutorial: 'Benötigen Sie ein Tutorial zu Beam Studio?',
        needNewInterfaceTutorial: 'Möchten Sie ein Tutorial für die neue Benutzeroberfläche von Beam Studio starten?',
        next: 'NÄCHSTER',
        look_for_machine: 'Suchmaschine für Tutorial ...',
        unable_to_find_machine: 'Maschine für Tutorial konnte nicht gefunden werden. Möchten Sie zur Verbindungseinstellungsseite gehen, das Tutorial wiederholen oder überspringen?',
        skip_tutorial: 'Sie haben das Tutorial übersprungen. Sie können das Tutorial jederzeit starten, indem Sie auf "Hilfe"> "Erstmaliges Tutorial anzeigen" klicken.',
        set_connection: 'Verbindung einstellen',
        retry: 'Wiederholen',
        newUser: {
            draw_a_circle: 'Zeichne einen Kreis',
            drag_to_draw: 'Zum Zeichnen ziehen',
            infill: 'Füllen einschalten',
            switch_to_layer_panel: 'Wechseln Sie zum Ebenenbedienfeld',
            set_preset_wood_engraving: 'Set Preset: Holz - Gravur',
            set_preset_wood_cut: 'Set Preset: Holz - Schneiden',
            add_new_layer: 'Fügen Sie eine neue Ebene hinzu',
            draw_a_rect: 'Zeichne ein Rechteck',
            switch_to_preview_mode: 'Wechseln Sie in den Vorschaumodus',
            preview_the_platform: 'Vorschau der Plattform',
            put_wood: '1. Legen Sie das Musterholz',
            adjust_focus: '2. Stellen Sie den Fokus ein',
            close_cover: '3. Schließen Sie die Abdeckung',
            send_the_file: 'Senden Sie die Datei',
            end_alert: 'Sind Sie sicher, das Tutorial zu beenden?',
            please_select_wood_engraving: 'Bitte wählen Sie die Voreinstellung "Holz - Gravur".',
            please_select_wood_cutting: 'Bitte wählen Sie die Voreinstellung "Holz - Schneiden".',
        },
        newInterface: {
            camera_preview: 'Kameravorschau',
            select_image_text: 'Wählen Sie / Bild / Text',
            basic_shapes: 'Grundformen',
            pen_tool: 'Stiftwerkzeug',
            add_new_layer: 'Neue Ebene hinzufügen',
            rename_by_double_click: 'Umbenennen durch Doppelklick',
            drag_to_sort: 'Zum Sortieren ziehen',
            layer_controls: 'Klicken Sie mit der rechten Maustaste, um Ebenensteuerelemente auszuwählen:\nEbenen duplizieren / zusammenführen / sperren / löschen',
            switch_between_layer_panel_and_object_panel: 'Wechseln Sie zwischen Ebenenbedienfeld und Objektbedienfeld',
            align_controls: 'Ausrichten Steuerelemente',
            group_controls: 'Gruppensteuerelemente',
            shape_operation: 'Formbetrieb',
            flip: 'Flip',
            object_actions: 'Objektaktionen',
            end_alert: 'Sind Sie sicher, die neue Einführung in die Benutzeroberfläche zu beenden?',
        },
        links: {
            adjust_focus_bm: 'https://flux3dp.zendesk.com/hc/en-us/articles/360001684196',
            adjust_focus_bb: ' https://support.flux3dp.com/hc/en-us/articles/360001683675-Adjusting-the-focus',
        },
        tutorial_complete: 'Das ist alles für das Tutorial. Jetzt ist es Zeit zu erstellen!',
    },
    slicer: {
        computing: 'Rechnen',
        error: {
            '6': 'Der berechnete Werkzeugweg befindet sich außerhalb des Arbeitsbereichs. Bitte verkleinere die Größe des Objekts/der Objekte, oder versuche, Raft, Krempe oder Rock auszuschalten.',
            '7': 'Beim Einstellen erweiterter Parameter ist ein Fehler aufgetreten.',
            '8': 'Slicing:: API gab ein leeres Ergebnis zurück.\nDie Ergebnisanforderung wird wahrscheinlich aufgerufen, bevor der Slice abgeschlossen ist.',
            '9': 'Slicing:: API gab einen leeren Pfad zurück.\nDie Anforderung für den Werkzeugweg wird wahrscheinlich aufgerufen, bevor der Slice abgeschlossen ist',
            '10': 'Slicing:: Fehlende Objektdaten. Das Quellobjekt fehlt in der Slicer-Engine',
            '13': 'Slicing:: Fehler bei der Duplikation\nDie ausgewählte ID ist nicht vorhanden. Wenn der Fehler durch einen Neustart von FLUX Studio nicht behoben wird, melde diesen Fehler bitte.',
            '14': 'Slicing:: Beim Setzen der Position ist ein Fehler aufgetreten. Das Quellobjekt fehlt in der Slicer-Engine',
            '15': 'Slicing:: Die hochgeladene Datei ist beschädigt. Bitte überprüfe die Datei und versuche es erneut.',
            '16': 'Slicing::: Fehler beim Setzen der Position: Slicing-Engine wurde anormal beendet, bitte erneut Slicen.',
            '1006': 'WS wurde unerwartet geschlossen, bitte holen Sie sich den Fehlerbericht aus dem Hilfe-Menü und senden Sie ihn an uns.'
        },
        pattern_not_supported_at_100_percent_infill: 'Slic3r unterstützt nur 100% Infill mit geradlinigem Infill-Muster'
    },
    calibration: {
        RESOURCE_BUSY: 'Bitte stelle sicher, dass sich das Gerät im Ruhezustand befindet',
        headMissing: 'Informationen zum Kopfmodul können nicht abgerufen werden, Bitte stelle sicher, dass sie angehängt sind.',
        calibrated: 'Automatisches Nivellieren abgeschlossen',
        extruderOnly: 'Bitte benutze den Druckwerkzeugkopf zur Kalibrierung'
    },
    head_info: {
        ID                  : 'ID',
        VERSION             : 'Firmware Version',
        HEAD_MODULE         : 'Werkzeugkopftyp',
        EXTRUDER            : 'Werkzeugkopf drucken',
        LASER               : 'Gravur-Werkzeugkopf',
        USED                : 'Benutzt',
        HARDWARE_VERSION    : 'Hardware Version',
        FOCAL_LENGTH        : 'Brennweite',
        hours               : 'Std',
        cannot_get_info     : 'Der Werkzeugkopf-Typ ist nicht lesbar'
    }
};
