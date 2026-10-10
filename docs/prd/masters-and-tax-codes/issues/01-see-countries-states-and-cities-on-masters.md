Status: ready-for-agent

## What to build

An operator opens Masters from the sidebar, before Settings, and sees three read-only tabs: Countries, States, and Cities. Countries show name, ISO2, ISO3, and whether the country is active, including India. States show the state name, the country name, and whether the state is active, including Gujarat under India. Cities show the city name, the state name, and whether the city is active, including Surat under Gujarat. Inactive locations stay on these tabs. There is no add, edit, delete, or sync. The client form still offers only active states and cities, still has no country control, and still resolves India itself. The sale stays an Order. The glossary records Country, State, and City.

## Acceptance criteria

- [ ] Masters is in the sidebar immediately before Settings and opens the location lists
- [ ] Countries, States, and Cities are separate tabs, in that order
- [ ] The Countries tab lists every country, including inactive ones, with name, ISO2, ISO3, and active, and India is visible
- [ ] The States tab lists every state, including inactive ones, with the state name, the country name, and active, and Gujarat is shown under India
- [ ] The Cities tab lists every city, including inactive ones, with the city name, the state name, and active, and Surat is shown under Gujarat
- [ ] Countries, States, and Cities have no add, edit, delete, or sync
- [ ] The client form still has no country control, still limits states and cities to active rows, and still requires a city that belongs to the selected state
- [ ] Orders stay Orders, and this slice does not add a Bill screen
- [ ] The glossary records Country, State, and City, and a client profile still stores a state id and a city id only

## Blocked by

None - can start immediately
