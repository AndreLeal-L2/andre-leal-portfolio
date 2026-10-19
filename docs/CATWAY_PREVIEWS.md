# CatWay preview images

The previews originate from the `LP3-Grupo4-master.zip` project supplied by the project owner. They are captured directly from the original FXML views and their bundled styles and assets, rendered with JavaFX 24.

| Portfolio asset | Original views |
| --- | --- |
| `public/assets/catway-routes.webp` | `Menu.fxml` with `SearchRoute.fxml` in its centre |
| `public/assets/catway-home.webp` | `Menu.fxml` with `Home.fxml` in its centre |
| `public/assets/catway-login.webp` | `Menu.fxml` with `Login.fxml` in its centre |

The shared header comes from `Menu.fxml`. When shown, the right-hand navigation uses the `sideMenu` container from `SideMenu.fxml`, matching the application's composition.

For capture, temporary copies of the views have their controller declarations and event handlers removed. The screenshot process renders the JavaFX interface without starting the application controllers or contacting databases or external services. Names, route results, journey counts and other dynamic values shown in the previews are demonstration data.

The route and home previews use the original bundled `img/map04.jpg` map. The application's interactive GraphStream map is normally built by `MapDrawer.DrawMap` from station and line data queried from the database; the bundled image supplies the network visual during this isolated capture.

These assets document the project's original interface. The capture process does not validate the complete database, payment or API workflows.
