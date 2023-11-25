<h1># 🏕 Camper's World</h1>

<p>
  <img src="https://i.imgur.com/NCajIoR.png" alt="campground">
</p>

Camper's World is a web platform tailored for camping enthusiasts, featuring user-friendly authentication, reviews, and effortless campground management. Whether you're a seasoned adventurer or new to camping, Camper's World offers a community-driven space to share your outdoor experiences.
Camper's World is a website where users can create and review campgrounds. In order to review or create a campground, you must have an account. This project was part of Colt Steele's web dev course on udemy.

This project was created using Node.js, Express, MongoDB, and Bootstrap. Passport.js was used to handle authentication.

<h2>Features</h2>
<ul>
<li>Users can create, edit, and remove campgrounds</li>
<li>Users can review campgrounds once, and edit or remove their review</li>
<li>User profiles include more information on the user (full name, email, phone, join date), their campgrounds, and the option to edit their profile or delete their account</li>
<li>Search campground by name or location</li>
<li>Sort campgrounds by highest rating, most reviewed, lowest price, or highest price</li>
</ul>
Configure these environmental variables as per your account credentials on Platforms like Cloudinary, MongoAtlas, Mapbox:
```
MAPBOX_TOKEN='<your_mapbox_token'
DB_URL='your_mongodb_url>'
CLOUDINARY_CLOUD_NAME='<your_cloud_name>'
CLOUDINARY_KEY='<your_cloudinary_key>'
CLOUDINARY_SECRET='<your_cloudinary_secret>'
SECRET='<any_string>'

```
