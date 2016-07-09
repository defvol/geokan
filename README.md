# geokan

Find geodata in CKAN

Flow:

- Search recursively for well-known geo formats
- Look for longitude/latitude properties in text formats
- Search for name of places in the remaining datasets, e.g. 'Baja California'
- Stream results to the console

Usage:

```bash
% geokan --format shp,csv > shp+csv.json
```
