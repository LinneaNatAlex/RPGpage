# Pet Discovery System 🐾

Et magisk system som lar kjæledyr finne gjenstander rundt om i borgen!

## Funksjonalitet

### Hvordan det fungerer:
- **Kjæledyr utforsker borgen** og finner tilfeldige gjenstander fra butikken
- **1-2 ganger per dag** kan kjæledyr finne nye gjenstander
- **Rarity system** - dyre gjenstander er sjeldnere å finne
- **Brukere får varsel** når kjæledyr finner noe
- **Accept/Decline** - brukere kan velge om de vil ta imot gjenstanden

### Rarity System:
- **50,000+ Nits**: 0.1% sjanse (veldig sjeldent)
- **10,000+ Nits**: 0.5% sjanse (sjeldent)
- **5,000+ Nits**: 1% sjanse (moderat sjeldent)
- **1,000+ Nits**: 5% sjanse (mid-range)
- **100+ Nits**: 15% sjanse (billig)
- **Under 100 Nits**: 25% sjanse (veldig billig)

### Timing:
- **Cooldown**: 12 timer mellom discoveries
- **Daglig grense**: Maksimalt 2 discoveries per dag
- **Automatisk sjekk**: Hver 30. minutt
- **Sjanse per sjekk**: 20% sjanse for discovery

## Teknisk Implementering

### Backend (`src/utils/petDiscovery.js`):
- `PetDiscoverySystem` klasse
- Rarity kalkulasjon basert på pris
- Cooldown og daglig grense håndtering
- Firebase integrasjon for lagring

### Frontend (`src/Components/PetDiscovery/`):
- `PetDiscoveryPanel` - hovedkomponent
- `PetDiscoveryNotification` - notifikasjon for hver discovery
- `usePetDiscovery` hook - React state management
- `PetDiscoveryTest` - test komponent for utvikling

### Scheduler (`src/utils/petDiscoveryScheduler.js`):
- Automatisk bakgrunnsprosess
- Sjekker alle brukere med aktive kjæledyr
- Triggerer discoveries basert på sannsynlighet

## Bruk

### For Brukere:
1. **Få et kjæledyr** fra butikken
2. **Sett det som aktivt kjæledyr** i inventory
3. **Vent på discoveries** - systemet kjører automatisk
4. **Sjekk Pet Discovery Panel** for nye funn
5. **Accept eller decline** discoveries

### For Utviklere:
- Test discoveries med "Trigger Test Discovery" knapp
- Sjekk console for debug informasjon
- Systemet kjører automatisk i bakgrunnen

## Konfigurasjon

### Endre timing:
```javascript
// I petDiscoveryScheduler.js
this.checkInterval = 30 * 60 * 1000; // 30 minutter
this.discoveryCooldown = 12 * 60 * 60 * 1000; // 12 timer
this.maxDiscoveriesPerDay = 2; // 2 per dag
```

### Endre rarity:
```javascript
// I petDiscovery.js
calculateDiscoveryChance(item) {
  const price = item.price || 0;
  if (price >= 50000) return 0.001; // 0.1%
  // ... osv
}
```

## Database Struktur

### User Document:
```javascript
{
  currentPet: { name, image, lastFed, customName },
  pendingPetDiscoveries: [
    {
      userId,
      petName,
      item: { name, price, description, ... },
      timestamp,
      status: 'pending'
    }
  ],
  lastPetDiscovery: timestamp,
  lastDiscoveryDate: 'YYYY-MM-DD',
  petDiscoveriesToday: number
}
```

## Feilsøking

### Vanlige problemer:
1. **Ingen discoveries**: Sjekk om bruker har aktivt kjæledyr
2. **Cooldown**: Vent 12 timer mellom discoveries
3. **Daglig grense**: Maksimalt 2 per dag
4. **Scheduler**: Sjekk at `petDiscoveryScheduler.start()` kjøres

### Debug:
```javascript
// Sjekk pending discoveries
const discoveries = await petDiscovery.getPendingDiscoveries(userId);

// Sjekk om bruker kan få discovery
const canDiscover = await petDiscovery.canHaveDiscovery(userId);

// Trigger manuell discovery
const discovery = await petDiscovery.triggerDiscovery(userId, petName);
```

## Fremtidige Forbedringer

- [ ] Forskjellige kjæledyr har forskjellige discovery rates
- [ ] Spesielle områder i borgen gir bedre discoveries
- [ ] Kjæledyr kan finne eksklusive gjenstander
- [ ] Achievement system for discoveries
- [ ] Kjæledyr leveling system
- [ ] Flere kjæledyr samtidig

---

**Magi i aksjon!** 🪄✨
