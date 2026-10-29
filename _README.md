### Points of Interest map

**Goal:** Developed a mobile-friendly interactive mapping application using React, TypeScript, and MapLibre GL, 
featuring custom POI types, nested locations, advanced filtering, and JSON-based data management. 
Implemented automated testing, CI workflows, and performance optimizations for large datasets.

**The idea was inspired by creating a Points of Interest map for the city.**

`screenshots or demo`
`launch instruction`

**Users can create and download their own route maps**

* Add different types of map markers, such as pinned attractions, custom places, or categorized locations
* For each marker, include a description, links, and its Google Maps location
* Add nested locations to group several points under a single map marker
* Search by name or filter by category
* Save all points to a JSON file or load them from one

* The app is built for mobile, but it works well on desktop too

<details>
<summary>Several options for map markers: pinned attractions, custom places and regular categorized places.</summary>

**Pinned attractions**: these highlight the main map centers

* These markers stay visible and do not merge with other pins when you zoom in or out.
* They have their own picture and a custom shape.
* They are not included in category searches.
* They can include extra locations inside them, such as FanFests.

**Custom places:** these highlight the main points of the routes or allow users to add personal photos.

* They use a large rectangular shape and can show custom photos or images.
* You can filter them like the “special places” category, which hides all smaller items from the map.
* They have a priority index. If two custom places are close together, the one with the higher index will collapse.

**Regular places**: restaurants, coffee shops, transport points, etc -- locations with fixed categories 

* They have their own category and category properties, like pin style and colors.
* All photos are shown inside the description.

</details>


**For future plans:**

Add a PostgreSQL database and the option to share your point list

`Trade-offs and limitation section`

<details>
<summary>Technical description</summary>

**Built with React, TypeScript, Vite, and MapLibre GL**

<todo> `architecture section`

Autotest: <todo>

**Reqirements:**
- [ ] The lazy loading for the collapsing zones and popups
- [ ] Collapsible pins for zoom in/ zoom out
- [ ] Category filter
- [ ] Search by name (with different options for the one location)
- [ ] Load, read and download JSONs
- [ ] Map editor to add new points and save changes to the JSON


**ToDo:**
- [ ] Make sure to test the core logic with both unit and end-to-end tests.
- [ ] Remember to handle errors, loading states, and empty states in the app.
- [ ] Set up continuous integration, linters, and automated build checks to keep the codebase healthy.

**Plan:**

Phase 1:
- [ ] Complete create, edit, move, delete, and nested-location flows
- [ ] Finish search, filtering, and JSON validation
- [ ] Add loading, empty, error, and unsaved-change states

Phase 2<br />
- [ ] Write unit and end-to-end tests
- [ ] Add CI, linting, type checking, and build checks
- [ ] Test with large generated datasets and profile performance

Phase 3<br />
- [ ] Deploy a stable demo and add screenshots
- [ ] Write architecture and setup documentation
- [ ] Record real test and performance results for the README and CV

Phase 4<br />
- [ ] Design an API and PostgreSQL data model
- [ ] Add saved maps and read-only sharing
- [ ] Implement authentication, authorization, and API tests

</details>

<details>
<summary>JSON example</summary>
</details>

<todo> `actual test coverage or measured performance`
