
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })
const DF_MATERIALS = [
  { name: 'MILKBOARD', gsm: 360, price_per_tonne: 1350 },
  { name: 'FBB', gsm: 330, price_per_tonne: 1350 },
  { name: 'KRAFT', gsm: 325, price_per_tonne: 1600 },
  { name: '2S KRAFT', gsm: 337, price_per_tonne: 1100 },
] as const
const DF_QTY = [1000,2500,3000,5000,10000,15000,20000,25000,30000,35000,40000,50000,60000,70000,80000,90000,100000]
const DF_LAM_STOCKS = [
  { key: 'gloss', name: 'Gloss', price_per_tonne: 5250 },
  { key: 'matte', name: 'Matte', price_per_tonne: 5500 },
] as const
const DF_WP_FILMS = [
  { key: 'pet', name: 'PET', gsm: 103, price_per_tonne: 4150 },
  { key: 'ca', name: 'Cellulose Acetate', gsm: 97, price_per_tonne: 28500 },
] as const

export default function App(){
  const [cfg, setCfg] = useState<any | null>(null)
  useEffect(()=>{
    fetch('/app-config.json').then(r=>r.ok?r.json():Promise.reject()).then(setCfg).catch(()=>{})
  }, [])

  const materials = cfg?.materials ?? DF_MATERIALS
  const qtyOpts = cfg?.qtyOptions ?? DF_QTY
  const lamStocks = cfg?.lamination?.stocks ?? DF_LAM_STOCKS
  const lamFilmGsm = cfg?.lamination?.film_gsm ?? 24
  const wpFilms = cfg?.windowFilms ?? DF_WP_FILMS

  const R_sheet = cfg?.rates?.sheet ?? { setup_hr:1.5, setup_rate:40, sph:2000, run_rate:35 }
  const R_die   = cfg?.rates?.die   ?? { setup_hr:1.5, setup_rate:40, sph:1100, run_rate:40 }
  const R_lam   = cfg?.rates?.lam   ?? { setup_hr:1.5, rate:35, sph:1000 }
  const R_wp    = cfg?.rates?.wp    ?? { setup_hr:1.5, rate:35, pph:800 }
  const R_glue  = cfg?.rates?.glue  ?? { sph:2000, op1:35, op2:45 }
  const R_print = cfg?.rates?.print ?? { sph:5000, combined_rate:65, setup_hr:1.0 }
  const INK = cfg?.ink ?? { price_per_kg: 0, g_per_m2_100pct: 1.5 }
  const COAT = cfg?.coating ?? { price_per_kg: 0, g_per_m2_100pct: 2.0, rate: 0 }
  const DIE_BUCKETS = cfg?.dieMakeReadyBuckets ?? { simple:20, standard:50, intricate:75, very:100 }
  const lamMRPct = cfg?.lamMakeReadyPct ?? 0.02
  const wpMRPct = cfg?.wpMakeReadyPct ?? 0.015
  const GLUE_SETUPS = cfg?.glueSetups ?? { sl:{setup_hr:3, mr_pieces_pct:0.03, mr_fixed:0}, cl:{setup_hr:6, mr_pieces_pct:0.06, mr_fixed:0}, c4:{setup_hr:4, mr_pieces_pct:0, mr_fixed:500}, c6:{setup_hr:5, mr_pieces_pct:0, mr_fixed:750} }
  const printMR = cfg?.printMR ?? { baseSheets:50, perColourSheets:25, coatingAdderSheets:20, varnishAdderSheets:10 }

  function tierMinMarkup(qty:number){
    const tiers = cfg?.minMarkupTiers as Array<{minQty:number, minMarkup:number}> | undefined
    if (tiers && tiers.length){
      let min = 0
      for(const t of tiers){ if(qty>=t.minQty && t.minMarkup>min) min=t.minMarkup }
      return min
    }
    if(qty>=10000) return 0.50; if(qty>=5000) return 0.60; if(qty>=1000) return 0.70; return 0
  }

  const [orderQty,setOrderQty]=useState(10000)
  const [len,setLen]=useState(720)
  const [wid,setWid]=useState(530)
  const [nUp,setNUp]=useState(1)
  const [matName,setMatName]=useState<string|undefined>(materials[1]?.name)
  const mat = materials.find((m:any)=>m.name===matName) ?? materials[1]
  const [priceMode,setPriceMode]=useState<'per_tonne'|'per_kg'>('per_tonne')
  const [price,setPrice]=useState<number>(mat.price_per_tonne)

  const baseSheets = useMemo(()=> Math.max(0, Math.ceil((orderQty||0)/Math.max(1,nUp))), [orderQty,nUp])
  const a = (Math.max(0,len)*Math.max(0,wid))/1_000_000
  const paperKgPerSheet = (a * mat.gsm)/1000
  const costPerKg = priceMode==='per_tonne' ? (price/1000) : price
  const paperCostPerSheet = paperKgPerSheet * costPerKg
  const materialPerUnit = nUp>0 ? paperCostPerSheet/Math.max(1,nUp) : 0

  const [sheetingOn,setSheetingOn]=useState(true)
  const [dieOn,setDieOn]=useState(true)
  const [dieWasteKey,setDieWasteKey]=useState<'simple'|'standard'|'intricate'|'very'>('standard')
  const dieWasteSheets = useMemo(()=> (DIE_BUCKETS as any)[dieWasteKey] ?? 50, [dieWasteKey, DIE_BUCKETS])

  const [printOn,setPrintOn]=useState(false)
  const [procCols,setProcCols]=useState(4)
  const [spotCols,setSpotCols]=useState(0)
  const [coverage,setCoverage]=useState(50)
  const [coatOn,setCoatOn]=useState(false)
  const [runRate,setRunRate]=useState(R_print.combined_rate ?? 65)
  const [printSetupHr,setPrintSetupHr]=useState(R_print.setup_hr ?? 1.0)
  useEffect(()=>{ if(!cfg) return; setRunRate(R_print.combined_rate ?? 65); setPrintSetupHr(R_print.setup_hr ?? 1.0)}, [cfg])

  const [lamOn,setLamOn]=useState(false)
  const [lamKey,setLamKey]=useState<typeof lamStocks[number]['key']>(lamStocks[0]?.key ?? 'gloss')
  const lamStock = lamStocks.find((x:any)=>x.key===lamKey) ?? lamStocks[0]
  const lamWasteSheets = useMemo(()=> Math.ceil(baseSheets*lamMRPct), [baseSheets,lamMRPct])

  const [wpOn,setWpOn]=useState(false)
  const [winW,setWinW]=useState(60)
  const [winH,setWinH]=useState(40)
  const [winPerPiece,setWinPerPiece]=useState(1)
  const [wpKey,setWpKey]=useState<typeof wpFilms[number]['key']>(wpFilms[0]?.key ?? 'pet')
  const wpFilm = wpFilms.find((x:any)=>x.key===wpKey) ?? wpFilms[0]

  const [glueType,setGlueType]=useState<'sl'|'cl'|'c4'|'c6'>('sl')

  const [admin,setAdmin] = useState(false)

  const dieSheetsForRun = baseSheets + dieWasteSheets
  const lamSheetsForRun = baseSheets + lamWasteSheets

  const sheeting = useMemo(()=>{
    if(!sheetingOn) return { perUnit:0, total:0 }
    const runPerSheet = R_sheet.run_rate/R_sheet.sph
    const sheets = baseSheets + dieWasteSheets + lamWasteSheets
    const total = R_sheet.setup_hr*R_sheet.setup_rate + sheets*runPerSheet
    return { perUnit: total/Math.max(1,orderQty), total }
  },[sheetingOn,baseSheets,dieWasteSheets,lamWasteSheets,orderQty,R_sheet])

  const diecut = useMemo(()=>{
    if(!dieOn) return { perUnit:0, total:0 }
    const runPerSheet = R_die.run_rate/R_die.sph
    const sheets = dieSheetsForRun
    const total = R_die.setup_hr*R_die.setup_rate + sheets*runPerSheet
    return { perUnit: total/Math.max(1,orderQty), total }
  },[dieOn,dieSheetsForRun,orderQty,R_die])

  const printing = useMemo(()=>{
    if(!printOn) return { perUnit:0, total:0, hours:0, inkCost:0, coatCost:0, mrSheets:0, printSheets:0 }
    const inks = Math.max(0, procCols) + Math.max(0, spotCols)
    const autoSetup = 1.0 + 0.25*inks
    const setupHr = autoSetup // override manual for now
    const mrSheets = (printMR.baseSheets||0) + (printMR.perColourSheets||0)*inks + (coatOn ? (printMR.coatingAdderSheets||0) : 0)
    const sheets = baseSheets + mrSheets
    const hours = setupHr + (sheets/ (R_print.sph || 5000))
    const labour = hours * (runRate || 65)

    const inkKgPerSheetOneColor = a * (INK.g_per_m2_100pct / 1000) * (Math.max(0, Math.min(100, coverage)) / 100)
    const inkKgTotal = sheets * inkKgPerSheetOneColor * inks
    const inkCost = inkKgTotal * (INK.price_per_kg || 0)

    let coatCost = 0
    let coatLabour = 0
    if (coatOn) {
      const coatKgPerSheet = a * (COAT.g_per_m2_100pct / 1000)
      const coatKgTotal = sheets * coatKgPerSheet
      coatCost = coatKgTotal * (COAT.price_per_kg || 0)
      if (COAT.rate && COAT.rate > 0) coatLabour = hours * COAT.rate
    }
    const total = labour + inkCost + coatCost + coatLabour
    return { perUnit: total/Math.max(1,orderQty), total, hours, inkCost, coatCost, mrSheets, printSheets: sheets }
  },[printOn,baseSheets,runRate,orderQty,procCols,spotCols,coverage,coatOn,INK,COAT,a,R_print, printMR])

  const lamination = useMemo(()=>{
    if(!lamOn) return { perUnit:0, total:0, filmPerUnit:0 }
    const sheets = lamSheetsForRun
    const filmKgPerSheet = (a * lamFilmGsm)/1000
    const filmCostPerKg = lamStock.price_per_tonne/1000
    const filmCostTotal = sheets * filmKgPerSheet * filmCostPerKg
    const setup = R_lam.setup_hr*R_lam.rate
    const run = (sheets/R_lam.sph)*R_lam.rate
    const total = setup + run + filmCostTotal
    return { perUnit: total/Math.max(1,orderQty), total, filmPerUnit: (filmKgPerSheet*filmCostPerKg)/Math.max(1,nUp) }
  },[lamOn,lamSheetsForRun,a,lamStock,orderQty,nUp,R_lam,lamFilmGsm])

  const windowPatch = useMemo(()=>{
    if(!wpOn) return { perUnit:0, total:0, matPerUnit:0 }
    const pieces = Math.ceil(orderQty*(1+wpMRPct))
    const areaP = (Math.max(0,winW)*Math.max(0,winH))/1_000_000
    const filmKgPerPiece = (areaP*wpFilm.gsm/1000) * winPerPiece
    const matCostPerKg = wpFilm.price_per_tonne/1000
    const matTotal = pieces * filmKgPerPiece * matCostPerKg
    const setup = R_wp.setup_hr*R_wp.rate
    const run = (pieces/R_wp.pph)*R_wp.rate
    const total = setup + run + matTotal
    return { perUnit: total/Math.max(1,orderQty), total, matPerUnit: filmKgPerPiece*matCostPerKg }
  },[wpOn,orderQty,winW,winH,winPerPiece,wpFilm,R_wp,wpMRPct])

  const gluing = useMemo(()=>{
    const c = (GLUE_SETUPS as any)[glueType] ?? {setup_hr:3, mrPiecesPct:0.03, mr_fixed:0}
    const mrPiecesPct = c.mr_pieces_pct ?? c.mrPiecesPct ?? 0
    const mrFixed = c.mr_fixed ?? 0
    const mr = Math.max(0, Math.ceil((orderQty*mrPiecesPct) + mrFixed))
    const pieces = orderQty + mr
    const setup = c.setup_hr*35
    const run = (pieces/(R_glue.sph||2000))*((R_glue.op1||35)+(R_glue.op2||45))
    const total = setup + run
    return { perUnit: total/Math.max(1,orderQty), total, mr }
  },[glueType,orderQty,R_glue,GLUE_SETUPS])

  const unitCost = materialPerUnit + sheeting.perUnit + diecut.perUnit + printing.perUnit + lamination.perUnit + windowPatch.perUnit + gluing.perUnit

  const PR = cfg?.pricing ?? { round_inc: 0.5, pretty_end: '0.95', default_strategy:'margin', default_target:0.25 }
  const targetPct = PR.default_target ?? 0.25
  const roundInc = PR.round_inc ?? 0.5
  const prettyEnd = PR.pretty_end ?? '0.95'
  const gstPct = 0.10

  const sellPer1000 = useMemo(()=>{
    const rawUnit = unitCost>0? unitCost/(1-targetPct):0
    let p1000 = rawUnit*1000
    const n = p1000/roundInc; p1000 = Math.ceil(n)*roundInc
    if(prettyEnd!=='none'){ const end = Number(prettyEnd); const whole = Math.floor(p1000); let cand = whole+end; if(cand<p1000) cand = whole+1+end; p1000=cand }
    return Number(p1000.toFixed(2))
  },[unitCost,targetPct,roundInc,prettyEnd])

  const sellUnit = sellPer1000/1000
  const orderEx = sellUnit*orderQty
  const orderInc = orderEx*(1+gstPct)
  const marginAch = sellUnit>0 ? (sellUnit-unitCost)/sellUnit : 0
  const markupAch = unitCost>0 ? (sellUnit-unitCost)/unitCost : 0
  const belowTier = markupAch < tierMinMarkup(orderQty)

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader><CardTitle className="text-xl">Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-end -mb-2">
              <label htmlFor="adminMode" className="text-xs text-gray-600 mr-2">Admin mode</label>
              <input id="adminMode" type="checkbox" className="h-3 w-3" checked={admin} onChange={(e)=>setAdmin(e.target.checked)} />
            </div>
        

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Order qty</Label>
                <Select value={String(orderQty)} onValueChange={(v)=>setOrderQty(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">{(qtyOpts||DF_QTY).map((q:number)=> <SelectItem key={q} value={String(q)}>{q.toLocaleString()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Units / sheet</Label>
                <Input type="number" inputMode="numeric" value={nUp} onChange={(e)=>setNUp(Math.max(1,Number(e.target.value)))} />
              </div>
              <div>
                <Label>Sheet length (mm)</Label>
                <Input type="number" inputMode="numeric" value={len} onChange={(e)=>setLen(Number(e.target.value))} />
              </div>
              <div>
                <Label>Sheet width (mm)</Label>
                <Input type="number" inputMode="numeric" value={wid} onChange={(e)=>setWid(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <Label>Material</Label>
                <Select value={matName} onValueChange={(v)=>{ setMatName(v); const m=materials.find((x:any)=>x.name===v)!; setPrice(m.price_per_tonne); }}>
                  <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent className="max-h-72">{materials.map((m:any)=> <SelectItem key={m.name} value={m.name}>{m.name} · {m.gsm}gsm</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price mode</Label>
                <Select value={priceMode} onValueChange={(v)=>setPriceMode(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="per_tonne">$ / tonne</SelectItem><SelectItem value="per_kg">$ / kg</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>{priceMode==='per_tonne'? 'Price ($/tonne)':'Price ($/kg)'}</Label>
                <Input type="number" inputMode="decimal" step="0.01" value={price} onChange={(e)=>setPrice(Number(e.target.value))} />
              </div>
            </div>

            <div className="p-3 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                <input type="checkbox" id="sheeting" checked={sheetingOn} onChange={(e)=>setSheetingOn(e.target.checked)} />
                <Label htmlFor="sheeting">Include sheeting</Label>
                <div className="ml-auto text-xs text-gray-600">Setup {money.format(R_sheet.setup_hr*R_sheet.setup_rate)} · Run {money.format(R_sheet.run_rate/R_sheet.sph)}/sheet</div>
              </div>
              <div>
                <Label>Die make-ready</Label>
                <Select value={dieWasteKey} onValueChange={(v)=>setDieWasteKey(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple ({DIE_BUCKETS.simple} sheets)</SelectItem>
                    <SelectItem value="standard">Standard ({DIE_BUCKETS.standard} sheets)</SelectItem>
                    <SelectItem value="intricate">Intricate ({DIE_BUCKETS.intricate} sheets)</SelectItem>
                    <SelectItem value="very">Very intricate ({DIE_BUCKETS.very} sheets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="dieon" checked={dieOn} onChange={(e)=>setDieOn(e.target.checked)} />
                <Label htmlFor="dieon">Include die cutting</Label>
                <div className="ml-auto text-xs text-gray-600">Setup {money.format(R_die.setup_hr*R_die.setup_rate)} · Run {money.format(R_die.run_rate/R_die.sph)}/sheet</div>
              </div>
            </div>

            <div className="p-3 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 md:col-span-4">
                <input type="checkbox" id="printon" checked={printOn} onChange={(e)=>setPrintOn(e.target.checked)} />
                <Label htmlFor="printon">Include printing</Label>
                <div className="ml-auto text-xs text-gray-600">Run speed {(R_print.sph||5000).toLocaleString()} sph</div>
              </div>

              <div>
                <Label>Process colours (CMYK)</Label>
                <Input type="number" inputMode="numeric" min={0} max={4} value={procCols} onChange={(e)=>setProcCols(Math.max(0, Math.min(4, Number(e.target.value))))} />
              </div>
              <div>
                <Label>Spot colours</Label>
                <Input type="number" inputMode="numeric" min={0} max={6} value={spotCols} onChange={(e)=>setSpotCols(Math.max(0, Math.min(6, Number(e.target.value))))} />
              </div>
              <div className="md:col-span-2">
                <Label>Average coverage (%)</Label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={100} step={1} value={coverage} onChange={(e)=>setCoverage(Number(e.target.value))} className="w-full" />
                  <Input type="number" inputMode="numeric" min={0} max={100} value={coverage} onChange={(e)=>setCoverage(Math.max(0, Math.min(100, Number(e.target.value))))} className="w-24 text-right" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="coaton" checked={coatOn} onChange={(e)=>setCoatOn(e.target.checked)} />
                <Label htmlFor="coaton">Enable coating</Label>
              </div>

              <div>
                <Label>Run rate ($/hr)</Label>
                <Input type="number" inputMode="decimal" step="0.01" value={runRate} onChange={(e)=>setRunRate(Number(e.target.value))} />
              </div>
              <div>
                <Label>Setup hours (auto)</Label>
                <Input readOnly value={(1.0 + 0.25*(Math.max(0,procCols)+Math.max(0,spotCols))).toFixed(2)} />
              </div>
              {admin && (
                <>
                  <div>
                    <Label>Print MR (sheets)</Label>
                    <Input readOnly value={((printMR.baseSheets||0) + (printMR.perColourSheets||0)*(Math.max(0,procCols)+Math.max(0,spotCols)) + (coatOn ? (printMR.coatingAdderSheets||0) : 0)).toLocaleString()} />
                  </div>
                  <div>
                    <Label>Sheets to print</Label>
                    <Input readOnly value={(baseSheets + ((printMR.baseSheets||0) + (printMR.perColourSheets||0)*(Math.max(0,procCols)+Math.max(0,spotCols)) + (coatOn ? (printMR.coatingAdderSheets||0) : 0))).toLocaleString()} />
                  </div>
                </>
              )}
            </div>

            <div className="p-3 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 md:col-span-3">
                <input type="checkbox" id="lamon" checked={lamOn} onChange={(e)=>setLamOn(e.target.checked)} />
                <Label htmlFor="lamon">Include lamination</Label>
                <div className="ml-auto text-xs text-gray-600">Setup {money.format(R_lam.setup_hr*R_lam.rate)} · Run {money.format(R_lam.rate/R_lam.sph)}/sheet</div>
              </div>
              <div>
                <Label>Laminate</Label>
                <Select value={lamKey} onValueChange={(v)=>setLamKey(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{lamStocks.map((s:any)=> <SelectItem key={s.key} value={s.key}>{s.name} (${s.price_per_tonne}/t)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lam make-ready</Label>
                <Input readOnly value={`${Math.ceil(baseSheets*lamMRPct).toLocaleString()} sheets (${(lamMRPct*100).toFixed(1)}%)`} />
              </div>
            </div>

            <div className="p-3 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 md:col-span-4">
                <input type="checkbox" id="wpon" checked={wpOn} onChange={(e)=>setWpOn(e.target.checked)} />
                <Label htmlFor="wpon">Include window patching</Label>
                <div className="ml-auto text-xs text-gray-600">Setup {money.format(R_wp.setup_hr*R_wp.rate)} · Run {money.format(R_wp.rate/R_wp.pph)}/piece</div>
              </div>
              <div>
                <Label>Film</Label>
                <Select value={wpKey} onValueChange={(v)=>setWpKey(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{wpFilms.map((f:any)=> <SelectItem key={f.key} value={f.key}>{f.name} · {f.gsm}gsm</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Window width (mm)</Label>
                <Input type="number" inputMode="numeric" value={winW} onChange={(e)=>setWinW(Number(e.target.value))} />
              </div>
              <div>
                <Label>Window height (mm)</Label>
                <Input type="number" inputMode="numeric" value={winH} onChange={(e)=>setWinH(Number(e.target.value))} />
              </div>
              <div>
                <Label>Windows / piece</Label>
                <Input type="number" inputMode="numeric" value={winPerPiece} onChange={(e)=>setWinPerPiece(Math.max(1,Number(e.target.value)))} />
              </div>
            </div>

            <div className="p-3 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Gluing type</Label>
                <Select value={glueType} onValueChange={(v)=>setGlueType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sl">Straight-Line</SelectItem>
                    <SelectItem value="cl">Crash-Lock</SelectItem>
                    <SelectItem value="c4">4 Corner</SelectItem>
                    <SelectItem value="c6">6 Corner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 text-xs text-gray-600 flex items-center">Runs at ~{(R_glue.sph||2000).toLocaleString()} pcs/hr · 2 operators @ ${(R_glue.op1||35)}+${(R_glue.op2||45)}/hr. Setup billed at one operator ($35/hr).</div>
            </div>

          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-xl">Results</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-end -mb-2">
              <label htmlFor="adminMode" className="text-xs text-gray-600 mr-2">Admin mode</label>
              <input id="adminMode" type="checkbox" className="h-3 w-3" checked={admin} onChange={(e)=>setAdmin(e.target.checked)} />
            </div>
        
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Sheet area (m²)</div><div className="text-right font-medium">{a? a.toFixed(4):'—'}</div>
              <div className="text-gray-600">Paper kg / sheet</div><div className="text-right font-medium">{paperKgPerSheet? paperKgPerSheet.toFixed(6):'—'}</div>
              <div className="text-gray-600">Base sheets</div><div className="text-right font-medium">{baseSheets.toLocaleString()}</div>
              <div className="text-gray-600">Die MR (sheets)</div><div className="text-right font-medium">{dieWasteSheets.toLocaleString()}</div>
              <div className="text-gray-600">Lam MR (sheets)</div><div className="text-right font-medium">{lamWasteSheets.toLocaleString()}</div>
              {admin && <>
                <div className="text-gray-600">Print MR (sheets)</div><div className="text-right font-medium">{printOn ? printing.mrSheets.toLocaleString() : '—'}</div>
                <div className="text-gray-600">Sheets to print</div><div className="text-right font-medium">{printOn ? printing.printSheets.toLocaleString() : '—'}</div>
              </>}
            </div>
            <div className="h-px bg-gray-200" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Material / unit</div><div className="text-right font-semibold">{money.format(materialPerUnit||0)}</div>
              <div className="text-gray-600">Sheeting / unit</div><div className="text-right font-medium">{money.format(sheeting.perUnit||0)}</div>
              <div className="text-gray-600">Die cut / unit</div><div className="text-right font-medium">{money.format(diecut.perUnit||0)}</div>
              <div className="text-gray-600">Printing / unit</div><div className="text-right font-medium">{money.format(printing.perUnit||0)}</div>
              <div className="text-gray-600">Lamination / unit</div><div className="text-right font-medium">{money.format(lamination.perUnit||0)}</div>
              <div className="text-gray-600">Window patch / unit</div><div className="text-right font-medium">{money.format(windowPatch.perUnit||0)}</div>
              <div className="text-gray-600">Gluing / unit</div><div className="text-right font-medium">{money.format(gluing.perUnit||0)}</div>
              <div className="text-gray-600">Combined unit cost</div><div className="text-right font-bold">{money.format((materialPerUnit + sheeting.perUnit + diecut.perUnit + printing.perUnit + lamination.perUnit + windowPatch.perUnit + gluing.perUnit)||0)}</div>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Sell / unit (ex-GST)</div><div className="text-right font-semibold">{money.format((sellPer1000/1000))}</div>
              <div className="text-gray-600">Sell / 1,000 (ex-GST)</div><div className="text-right font-semibold">{money.format(sellPer1000)}</div>
              <div className="text-gray-600">Order total (ex-GST)</div><div className="text-right font-semibold">{money.format(orderEx)}</div>
              <div className="text-gray-600">GST (10%)</div><div className="text-right font-medium">{money.format(orderInc-orderEx)}</div>
              <div className="text-gray-600">Total inc-GST</div><div className="text-right font-semibold">{money.format(orderInc)}</div>
              <div className="text-gray-600">Margin achieved</div><div className={`text-right font-medium ${marginAch < 0 ? 'text-red-600' : ''}`}>{(marginAch*100).toFixed(1)}%</div>
              <div className="text-gray-600">Markup achieved</div><div className={`text-right font-medium ${belowTier ? 'text-red-600' : ''}`}>{(markupAch*100).toFixed(1)}%</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
