# Product Overview

Transient is a cross-platform mobile application built with Expo and React Native. It targets iOS, Android and web from a single codebase.

Transient aims to act like the Uber of the music gigging scene. The app will be able to allow users and venues to create gigs and events, set criteria for what they are looking for and then have the event push out to local musicians. Think Uber, where the driver can choose to accept a price and the requester gets a ride.

Transient should have a musician view, allowing them to see and accept gigs, whilst also having a hoster view, allowing people to create events. 

The will have a main dashboard, with side scrolling elements showing latest gigs in your area, another for recently viewed gigs and another for accepted / upcoming gigs. The app will have a map feature which shows gigs available. Ultimately, Transient will be experience focused, aiming to be easy to use, much like similar gig-economy apps like Uber and Lyft.

The front end is using React Native, with the backend using FastAPI and Python. Test and Production databases will be hosted in Supabase. Development should use local mock data.

The app is registered under the EAS project ID `b750cc2e-ec1f-417c-a903-c80c79141894` with the owner `transient`.

## CI/CD

We will be using Github Actions to handle CI/CD on push to `main` (paths: `./src/*`, `./assets/*`). Deploys sequentially to test then prod.

## Team

Transient is being solely developed at the moment by a Senior Data Engineer, so is strong in backend but requires more support in the front end.

The team embraces AI but we also want to ensure that using AI is a learning experience. For every fix or feature developed, ensure that the explanation is used as a teaching opportunity.
