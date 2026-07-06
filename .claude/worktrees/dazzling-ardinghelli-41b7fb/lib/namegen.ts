// Prop-archive name generator. Generates plausible 1–4 word names in the
// style of existing artifacts (RED BREAD, DIO SAKE, DEAD GODS COMIC BOOK SPACE MAN, THING, etc).
//
// Patterns, weighted (roughly):
//   30%  MOOD OBJECT           "HOLLOW KILN"
//   18%  MATERIAL OBJECT       "IRON VESSEL"
//   12%  MOOD ABSTRACT         "DIM PROTOCOL"
//    8%  NOUN NOUN             "GHOST APPARATUS"
//    7%  VERB OBJECT           "BREAK LATTICE"
//    6%  OBJECT OF MATERIAL    "VESSEL OF GLASS"
//    6%  MOOD MATERIAL OBJECT  "SALT GLASS BRAND"
//    5%  POSSESSIVE OBJECT     "ARLA'S KILN"
//    4%  LONG 4-word           "DEAD GODS COMIC BOOK"
//    3%  SHORT single          "THING"
//    3%  FIRST_NAME CONSUMABLE "DIO SAKE"

const MOOD = [
  'HOLLOW','DRIFT','PALE','STATIC','SILENT','VACANT','FAINT','DIM','FROZEN','ARID',
  'DEEP','COLD','LATE','WORN','GHOST','SHORN','LOOSE','BENT','QUIET','BLUNT',
  'SALT','EMBER','DUSK','ASH','RUST','SMOKE','CHALK','BONE','RED','BLUE',
  'GREEN','DEAD','WET','DRY','STRAY','LOST','HARSH','SOFT','NEW','OLD',
  'SLOW','SUNKEN','RAW','HUSHED','LONG','SPARE','BLEACHED','MILD','SMALL','GRAY',
  'FALLEN','HOLLOWED','RESIDUAL','QUIET','NEAR','MUTE','CRACKED','BRITTLE','SEVERED','PATINA',
  'COARSE','FAR','NORTH','SOUTH','EAST','WEST','MOONLIT','UNDER','HIDDEN','BURNED',
] as const;

const MATERIAL = [
  'IRON','GLASS','COBALT','BRONZE','PAPER','RESIN','CONCRETE','VELVET','FOAM','WAX',
  'BRASS','BAKELITE','VINYL','STEEL','CANVAS','SILICONE','GYPSUM','MYLAR','LATEX','CORK',
  'LEAD','COPPER','TIN','ZINC','GRAPHITE','BONE','ONYX','JADE','BASALT','LACQUER',
  'PITCH','TAR','SLATE','FELT','TWINE','CERAMIC','PORCELAIN','ALUMINUM','MERCURY','SALT',
  'ASHWOOD','OAK','ELM','BIRCH','PINE','IVORY','CORDUROY','LINEN','GAUZE','SINEW',
] as const;

const OBJECT = [
  'BEACON','KILN','VESSEL','FORGE','CORE','LATTICE','APPARATUS','DEVICE','UNIT','MODULE',
  'SHELL','MASK','BRAND','ENGINE','CONSOLE','TOKEN','MANIFEST','LOOM','LENS','RIG',
  'BRACE','CASKET','FRAME','CELL','NODE','MARKER','CARRIAGE','PLATE','BADGE','LIGATURE',
  'PANEL','SWITCH','MIRROR','ANVIL','GAUNTLET','HARNESS','SIGIL','CROWN','CUFF','SHROUD',
  'ORRERY','RELIQUARY','CARTRIDGE','SPOOL','PYLON','TOTEM','GLAIVE','CRUCIBLE','CHALICE','STYLUS',
  'DRUM','EFFIGY','GRATE','COIL','DIAL','SPINDLE','WARDEN','COLUMN','ROOD','BOOK',
] as const;

const ABSTRACT = [
  'FIELD','PROTOCOL','STUDY','DIRECTIVE','TRANSMISSION','ANOMALY','RECORD','CYCLE','SCAN','GRADE',
  'SPECIMEN','INDEX','ENTRY','MARK','TRACE','DRAFT','FRAGMENT','RELIC','SAMPLE','CAST',
  'LEDGER','DOSSIER','CANON','MEMO','RITE','CHANT','VERSE','REPORT','CITATION','DOCKET',
  'COMMUNIQUE','DECREE','PRECEDENT','EDICT','WAYBILL','REQUEST','WARRANT','RULING','FILING','ERRATUM',
] as const;

const VERB = [
  'BREAK','BIND','SEAL','MARK','SIFT','CARRY','BURY','WAKE','RINSE','SHEAR',
  'COUNT','GUARD','WASH','GATHER','MEND','REND','BEAT','SNUFF','PRESS','HOLD',
  'CALL','COOL','HEAT','SALT','SMOKE','BLEACH','STITCH','LOCK','HARNESS','DRAW',
] as const;

const SHORT = [
  'BOB','THING','RIG','GLYPH','CUE','HAZE','SPUR','CUFF','HIVE','SLAB',
  'KERN','FRAY','VAULT','CHORD','DRUM','SEAM','KNOB','AXIS','WEDGE','FLINT',
  'TANG','RIME','GORE','LINT','SCAR','RICK','GRIT','PLUMB','QUIRE','GLEAN',
  'CAIRN','COG','SHIM','PYRE','NOOSE','HOOK','STOW','TALLY','FRIEZE','WANE',
] as const;

const FIRST_NAMES = [
  'DIO','ARLA','MORA','KAZ','IRA','ELI','RHEA','VITA','OSCAR','NIX',
  'SALEM','MARLO','HESTER','VANYA','TORBEN','LIND','IDA','CASS','REMI','JUNO',
  'OTIS','BRUNO','NELL','LOU','POE','RAFA','SAGE','SONYA','TRIX','WREN',
  'ZUZA','CALEB','KENJI','ADA','ASH','MIRA','NICO','OREN','TULLY','YULIA',
] as const;

const CONSUMABLES = [
  'SAKE','BREAD','TEA','BEER','SALT','WINE','OIL','INK','SOAP','TINCTURE',
  'BROTH','HONEY','ALE','RUM','TOBACCO','POTION','POWDER','CORDIAL','LOZENGE','PASTE',
] as const;

const LONG4 = [
  'DEAD GODS COMIC BOOK',
  'SPACE MAN RELIC STUDY',
  'COLD ARCHIVE FIELD UNIT',
  'MINOR GLASS CASKET BRAND',
  'DOMESTIC FOAM CORE MODULE',
  'BONE CARRIAGE NIGHT PROTOCOL',
  'PALE COBALT SPECIMEN MARK',
  'SMOKE BADGE DIRECTIVE INDEX',
  'QUIET HOLLOW BONE APPARATUS',
  'LAST WARDEN OF THE FIELD',
  'FIRST CAST STUDY FRAGMENT',
  'SHORN LINEN HARVEST MEMO',
  'NIGHT LATTICE HARBOR RELAY',
  'SEVEN BELLS DISPATCH MODULE',
  'LATE MERCURY GLASS RECORD',
  'BITTER GYPSUM PILGRIM RITE',
] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function possessive(name: string): string {
  // Simple rule — names in our bank are already short caps; just append 'S.
  return name.endsWith('S') ? `${name}'` : `${name}'S`;
}

// Dedupe against the previous 8 generations at runtime so repeated clicks
// don't feel stale. Reset naturally when the module is reloaded.
const recent: string[] = [];
const RECENT_MAX = 8;

function generateOnce(): string {
  const r = Math.random();
  if (r < 0.30) return `${pick(MOOD)} ${pick(OBJECT)}`;
  if (r < 0.48) return `${pick(MATERIAL)} ${pick(OBJECT)}`;
  if (r < 0.60) return `${pick(MOOD)} ${pick(ABSTRACT)}`;
  if (r < 0.68) return `${pick(MOOD)} ${pick(OBJECT)}`; // extra MOOD OBJECT weight
  if (r < 0.75) return `${pick(VERB)} ${pick(OBJECT)}`;
  if (r < 0.81) return `${pick(OBJECT)} OF ${pick(MATERIAL)}`;
  if (r < 0.87) return `${pick(MOOD)} ${pick(MATERIAL)} ${pick(OBJECT)}`;
  if (r < 0.92) return `${possessive(pick(FIRST_NAMES))} ${pick(OBJECT)}`;
  if (r < 0.96) return pick(LONG4);
  if (r < 0.985) return pick(SHORT);
  return `${pick(FIRST_NAMES)} ${pick(CONSUMABLES)}`;
}

/** Generate a new artifact name. Rejects immediate duplicates. */
export function generateName(): string {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateOnce();
    if (!recent.includes(candidate)) {
      recent.push(candidate);
      if (recent.length > RECENT_MAX) recent.shift();
      return candidate;
    }
  }
  return generateOnce();
}

/** Generate a filename-safe slug for a stored artifact. */
export function generateSlug(): string {
  return generateName().toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
}
