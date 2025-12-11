$file = 'c:\Rikolino\proyecto-main\frontend\src\pages\DrogueriasAdmin.jsx'
if (-not (Test-Path $file)) { Write-Error "File not found: $file"; exit 1 }
$text = Get-Content -Raw -LiteralPath $file

# 1) update import
$text = $text -replace 'import API from "../services/api";','import API, { getPerfil } from "../services/api";'

# 2) add currentUser state after selectedD state
$text = $text -replace '(const \[selectedD, setSelectedD\] = useState\(null\);)',$1 + "\n  const [currentUser, setCurrentUser] = useState(null);"

# 3) add loadProfile after load(); line in useEffect
$anchor = "    load();"
if ($text -match ([regex]::Escape($anchor))) {
    $insert = @"
    // load current profile to show active drogueria
    const loadProfile = async () => {
      try {
        const p = await getPerfil();
        // API.getPerfil returns axios response
        const data = p.data || p.data?.usuario || p.data?.user || null;
        setCurrentUser(data);
      } catch (err) {
        // ignore — user might not be authenticated in this view
        console.debug(\"No profile loaded:\", err?.message || err);
      }
    };
    loadProfile();
"@
    $text = $text -replace ([regex]::Escape($anchor)), [regex]::Escape($anchor) -replace '\\','\\' # noop to force
    # simpler: replace first occurrence manually
    $text = $text -replace ([regex]::Escape($anchor)), $anchor + "\n" + $insert
}

# 4) add setActiveDrogueria after setTransferOpen(true);
$anchor2 = "    setTransferOpen(true);"
if ($text -match ([regex]::Escape($anchor2))) {
    $insert2 = @"

  const setActiveDrogueria = async (d) => {
    try {
      setMsg(null);
      const resp = await API.post('/droguerias/set_active/', { drogueria: d.id });
      // refresh profile so UI shows active selection
      try {
        const p = await getPerfil();
        const u = p.data || p.data?.usuario || p.data?.user || null;
        setCurrentUser(u);
        if (u) {
          try { localStorage.setItem('usuario', JSON.stringify(u)); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        console.warn('Could not refresh profile after set_active:', e?.message || e);
      }
      setMsg({ type: 'success', text: resp.data?.detail || 'Droguería activa establecida' });
    } catch (e) {
      console.error('Error activando droguería:', e);
      setMsg({ type: 'error', text: e.response?.data?.detail || 'No se pudo activar la droguería' });
    }
  };
"@
    $text = $text -replace ([regex]::Escape($anchor2)), $anchor2 + $insert2
}

# write back
Set-Content -LiteralPath $file -Value $text -Encoding UTF8
Write-Host "Patched $file" -ForegroundColor Green
