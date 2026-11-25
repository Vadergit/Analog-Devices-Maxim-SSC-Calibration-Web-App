# Analog Devices / Maxim SSC Calibration Web App

[Web-App](https://vadergit.github.io/Analog-Devices-Maxim-SSC-Calibration-Web-App/) · [SSC Calibration Studio](https://vadergit.github.io/SSC-Calibration-Studio/)

**v0.2.0 – Laborprototyp, keine Hardwarefreigabe.** Geführte Ansicht nach dem Elmos-Master, inklusive Messmatrix, Brückenrechner, Temperaturkennlinie, Host-Druckmodell bis dritter Ordnung, unabhängiger Nachmessung und Export. MAX40109 ist das Hauptmodell; MAX1454 bleibt als manuelle lineare Host-Auswertung erhalten.

## Quellen und Abgrenzung

- [MAX40109 Datenblatt Rev. 3](https://www.analog.com/media/en/technical-documentation/data-sheets/max40109.pdf): Registerübersicht S. 19–20, PGA Tabelle 9, Polynom S. 36–37, I²C S. 44–45, Kalibrierung S. 55.
- [MAX1454 Datenblatt](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX1454.pdf): analoger DAC-/Flash-Abgleich, nicht kompatibel zum MAX40109-DSP.
- [Elmos Master](https://github.com/Vadergit/ELMOS-E703.11-Calibration-Web-App): geführter Ablauf, Farbwelt und Navigation. Keine Elmos-Register übernommen.

Die MAX40109-Druckformel hat die Gruppen h/g/n/m für P⁰/P¹/P²/P³, jeweils bis T³; die Temperaturformel nutzt k0…k3. Der Host verwendet normierte Rohcodes und Referenzwerte in Benutzereinheiten; Temperatur-Fit in °C wird separat ausgegeben. Das ist ausdrücklich **kein** fertig skalierter DSP-/MTP-Koeffizientensatz. Die reale Kodierung, korrigierte Temperatur als DSP-Eingang, Ausgangsskalierung, Quantisierung, Registerreihenfolge, Speicherfreigabe und Rücklesung müssen separat implementiert und validiert werden.

## Experimentelle I²C-Lesebridge

Firmware: `firmware/esp32c3_max40109_readonly/esp32c3_max40109_readonly.ino`. Arduino IDE mit ESP32-C3 Boardpaket und USB CDC beim Booten aktiv. SDA GPIO4, SCL GPIO5, 100 kHz, Standardadresse 0x4D. Externe, datenblattkonforme Versorgung, Pegelanpassung, Pullups, gemeinsame Masse und DQ high erforderlich; GPIO niemals direkt an Hochvoltversorgung anschliessen. Firmware schaltet die Sensorversorgung nicht. Nur bei passender Testschaltung verwenden.

Web Serial (Chrome/Edge, HTTPS oder localhost), 115200 Baud. HELLO prüft Adapter, nicht Chipidentität. READ 06/08/0F/11 liest jeweils 16 Bit mit repeated START, MSB zuerst. Keine Registerwert-Schreiboperationen; Registeradressauswahl ist Teil der I²C-Leseoperation. Messung liest den letzten Registerwert, keine garantierte neue oder synchrone Konversion. Kein automatisches Sampling. Keine Unterstützung für Hersteller-Evalboard, PLC, 1-Wire oder MAX1454-Hardware. Firmware und Verbindung sind noch nicht an realer Hardware validiert.

## Lokaler Test

`python3 -m http.server 8000 --bind 127.0.0.1` und http://127.0.0.1:8000 öffnen. Rechentests: `node --test tests/engine.test.mjs`.

## Freigabeschritte

1. Modell-/Revisionsidentifikation und vollständige Register-/Speicherdokumentation prüfen.
2. 1-Wire-Transport, Frische-/Statusprüfung, Versorgung und AFE-RAM-Änderungen am Prüfaufbau validieren.
3. Gerätespezifische Temperatur- und Druckkoeffizienten inklusive Zielskalierung und Quantisierung implementieren; unabhängige Golden Vectors.
4. Speicher-Backup, Schutzbits, Änderungsvergleich, explizite Bestätigung, kontrollierte Programmierung, Rücklesung und Kaltstartprüfung.
5. MAX1454 separat mit Herstellerverfahren und DAC-/Flash-Treiber implementieren.
6. Automatisches Logging, Archivimport und eigenständiges PDF-Layout ergänzen. Aktuell CSV/JSON und Browser-Druckansicht.
