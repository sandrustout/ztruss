-- TripWise Initial Seed Data
-- Clearly labelled as "Sample data" for development and evaluation

-- 1. IMAGES (Public domain and Creative Commons licensed imagery)
INSERT INTO public.images (id, storage_path, public_url, source, author, licence, attribution_text, width, height)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'destinations/goa.jpg', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', 'Unsplash', 'Ashish Verma', 'Unsplash Licence', 'Photo by Ashish Verma on Unsplash (Sample data)', 1200, 800),
    ('a0000000-0000-0000-0000-000000000002', 'destinations/jaipur.jpg', 'https://images.unsplash.com/photo-1603288967396-857502c3c6f2?auto=format&fit=crop&w=1200&q=80', 'Unsplash', 'Annie Spratt', 'Unsplash Licence', 'Photo by Annie Spratt on Unsplash (Sample data)', 1200, 800),
    ('a0000000-0000-0000-0000-000000000003', 'destinations/kochi.jpg', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80', 'Unsplash', 'Sibi K', 'Unsplash Licence', 'Photo by Sibi K on Unsplash (Sample data)', 1200, 800),
    ('a0000000-0000-0000-0000-000000000004', 'destinations/varanasi.jpg', 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80', 'Unsplash', 'Pradeep Gopal', 'Unsplash Licence', 'Photo by Pradeep Gopal on Unsplash (Sample data)', 1200, 800),
    ('a0000000-0000-0000-0000-000000000005', 'destinations/bengaluru.jpg', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80', 'Unsplash', 'Ayan Mukherjee', 'Unsplash Licence', 'Photo by Ayan Mukherjee on Unsplash (Sample data)', 1200, 800),
    ('a0000000-0000-0000-0000-000000000006', 'destinations/tokyo.jpg', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', 'Unsplash', 'Jezael Melgoza', 'Unsplash Licence', 'Photo by Jezael Melgoza on Unsplash (Sample data)', 1200, 800)
ON CONFLICT (id) DO NOTHING;

-- 2. DESTINATIONS
INSERT INTO public.destinations (id, name, country, region, lat, lng, iata_codes, timezone, description, wiki_title, hero_image_id, source)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Goa', 'India', 'Western Coast', 15.2993, 74.1240, ARRAY['GOI', 'GOX'], 'Asia/Kolkata', 'Coastal state celebrated for Portuguese heritage churches, spice plantations, and golden sandy coastlines.', 'Goa', 'a0000000-0000-0000-0000-000000000001', 'curated_seed'),
    ('d0000000-0000-0000-0000-000000000002', 'Jaipur', 'India', 'Rajasthan', 26.9124, 75.7873, ARRAY['JAI'], 'Asia/Kolkata', 'The Pink City of Rajasthan, renowned for UNESCO World Heritage palaces, observatories, and hill forts.', 'Jaipur', 'a0000000-0000-0000-0000-000000000002', 'curated_seed'),
    ('d0000000-0000-0000-0000-000000000003', 'Kochi', 'India', 'Kerala', 9.9312, 76.2673, ARRAY['COK'], 'Asia/Kolkata', 'Historic port city featuring Portuguese colonial architecture, Chinese fishing nets, and spice trading streets.', 'Kochi', 'a0000000-0000-0000-0000-000000000003', 'curated_seed'),
    ('d0000000-0000-0000-0000-000000000004', 'Varanasi', 'India', 'Uttar Pradesh', 25.3176, 82.9739, ARRAY['VNS'], 'Asia/Kolkata', 'Ancient spiritual capital on the banks of the sacred Ganges, with centuries of culture, weaving, and philosophy.', 'Varanasi', 'a0000000-0000-0000-0000-000000000004', 'curated_seed'),
    ('d0000000-0000-0000-0000-000000000005', 'Bengaluru', 'India', 'Karnataka', 12.9716, 77.5946, ARRAY['BLR'], 'Asia/Kolkata', 'India garden and technology metropolis known for Victorian parks, craft breweries, and cultural venues.', 'Bangalore', 'a0000000-0000-0000-0000-000000000005', 'curated_seed'),
    ('d0000000-0000-0000-0000-000000000006', 'Tokyo', 'Japan', 'Kanto', 35.6762, 139.6503, ARRAY['HND', 'NRT'], 'Asia/Tokyo', 'Global capital fusing historic shrines, neon-lit districts, high-speed rail networks, and gastronomy.', 'Tokyo', 'a0000000-0000-0000-0000-000000000006', 'curated_seed')
ON CONFLICT (id) DO NOTHING;
