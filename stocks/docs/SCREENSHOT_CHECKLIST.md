# TripWise Screenshot Checklist

Capture each of the following screens and key states to assemble your final submission PDF named `<registerNo>_Full-Stack.pdf` for AWS Student Builder Group, VIT Chennai (Track 3: Full-Stack).

## Desktop Views
- [ ] **01_Explore_Home_Hero**: Desktop homepage showing navbar, brand palette, TextType animated headline ("Save up to 55% on your next trip"), and search bar.
- [ ] **02_Explore_Stats_LogoLoop**: Homepage stats strip with CountUp numbers ("Destinations covered", "Providers compared") and LogoLoop showing integrated APIs.
- [ ] **03_Search_Results_Flights**: `/search` page showing flight comparison tab, cabin switcher, value scores, provider names, and savings percentage badge.
- [ ] **04_Search_Results_Hotels**: `/search` page showing stays tab with TripWise Index score badges (0-100), CardSwap priority control, and Folder reasons.
- [ ] **05_Search_Results_Places**: `/search` places tab with category chips (Monuments, Nature, Food, etc.) and ScrollStack cards.
- [ ] **06_Destination_Details**: `/destination/:id` destination detail view with hero image, climate/weather strip, facts, editorial food picks, and festivals.
- [ ] **07_Itinerary_Planner_Empty**: `/trip/:tripId` fresh trip planner showing Suggestions column, empty day columns with call-to-action, map panel, and cost summary.
- [ ] **08_Itinerary_Planner_Populated**: `/trip/:tripId` populated drag-and-drop itinerary board with scheduled stops, "Leave by HH:MM" badges, travel legs with traffic indicators.
- [ ] **09_Itinerary_Optimise_Modal**: "Optimise this day" dialog showing before-and-after travel time comparison using 2-opt heuristic.
- [ ] **10_Bill_Unpaid_View**: `/trip/:tripId/bill` showing itemised bill breakdown, CountUp total, savings percentage, "Save as unpaid bill" button, and sandbox notice.
- [ ] **11_Sandbox_Payment_Modal**: Razorpay sandbox checkout dialog showing "Sandbox payment. No real money is charged" badge and test payment modes.
- [ ] **12_My_Trips_List**: `/trips` view displaying upcoming trips, draft trips, and status chips.
- [ ] **13_Past_Trips_History**: `/history` page displaying visited destinations, user rating, personal journal, trip spend, and CountUp stats.
- [ ] **14_Profile_Settings**: `/profile` page with home airport, currency preference, travel style, and dark/light theme switcher.

## Mobile Responsive Views (Tested at 390px Width)
- [ ] **15_Mobile_Home_Hero**: Mobile homepage with responsive stacked search bar and navigation drawer.
- [ ] **16_Mobile_Search_Tabs**: Mobile results view with horizontal tab switcher and filter bottom sheet.
- [ ] **17_Mobile_Planner_DayView**: Mobile itinerary board with day tabs and swipe-friendly item cards.
- [ ] **18_Mobile_Bill_View**: Mobile bill view with responsive invoice table and sticky pay bar.

## Key Edge States
- [ ] **19_Search_Empty_State**: Filter combination with 0 matches showing friendly line illustration and "Clear filters" action.
- [ ] **20_Error_Recovery_State**: Partial provider timeout notice showing graceful fallback data and retry button.
