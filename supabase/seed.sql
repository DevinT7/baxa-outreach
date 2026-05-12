-- ============================================================
-- BAXA Outreach Portal — Seed Data
-- Run AFTER schema.sql in your Supabase SQL editor
-- Parsed from "Outreach Contacts 2025-2026 - Companies.csv"
-- ============================================================

-- Helper: insert company + return id in one go
-- We use a DO block so we can capture IDs cleanly

DO $$
DECLARE
  cid uuid;
BEGIN

  -- Accenture
  INSERT INTO companies (name) VALUES ('Accenture') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'tara.c.mery@accenture.com');

  -- Amazon
  INSERT INTO companies (name) VALUES ('Amazon') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Idahl@amazon.com'),
    (cid, 'colbyw@amazon.com'),
    (cid, 'utexasadvertising@amazon.com');

  -- American Airlines
  INSERT INTO companies (name) VALUES ('American Airlines') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Robin.Mitchell@aa.com'),
    (cid, 'Lissa.Leibson@aa.com'),
    (cid, 'grace.hwang@aa.com');

  -- AMD
  INSERT INTO companies (name) VALUES ('AMD') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Tiffany.McKay@amd.com'),
    (cid, 'Makenzi.Gamez@amd.com'),
    (cid, 'UniversityRelations.US@amd.com');

  -- Apple
  INSERT INTO companies (name) VALUES ('Apple') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'katie.hodges@apple.com'),
    (cid, 'shimizu@apple.com'),
    (cid, 'bratkinson@apple.com'),
    (cid, 'jrector@apple.com'),
    (cid, 'taguilar@apple.com');

  -- AT&T
  INSERT INTO companies (name) VALUES ('AT&T') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'ms306y@att.com');

  -- Bain and Company
  INSERT INTO companies (name) VALUES ('Bain and Company') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Natasha.Curtis@bain.com'),
    (cid, 'Meghan.Reilly@bain.com'),
    (cid, 'Texas.Recruiting@Bain.com'),
    (cid, 'Kiri.Katterhenry@bain.com'),
    (cid, 'Bhargav.Srinivasan@bain.com'),
    (cid, 'Jordan.Walker@bain.com'),
    (cid, 'Morgan.Maxwell@bain.com'),
    (cid, 'Margaret.Berno@bain.com'),
    (cid, 'Sharan.Kumaresan@bain.com'),
    (cid, 'Grace.Feenstra@bain.com'),
    (cid, 'William.Hoenig@bain.com'),
    (cid, 'Kenny.Young@bain.com'),
    (cid, 'Leslie.Zhang@bain.com'),
    (cid, 'Eugene.Han@bain.com');

  -- Bank of America
  INSERT INTO companies (name) VALUES ('Bank of America') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'megan.hopkins@bofa.com');

  -- Best Buy
  INSERT INTO companies (name) VALUES ('Best Buy') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Evelline.Samson@bestbuy.com');

  -- Capital One
  INSERT INTO companies (name) VALUES ('Capital One') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'sara.greene@capitalone.com'),
    (cid, 'raschell.parker@capitalone.com'),
    (cid, 'natalie.seal@capitalone.com');

  -- Centene
  INSERT INTO companies (name) VALUES ('Centene') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'CAMPUSRELATIONS@centene.com');

  -- CGI
  INSERT INTO companies (name) VALUES ('CGI') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'gaby.lio@cgi.com');

  -- Charles Schwab
  INSERT INTO companies (name) VALUES ('Charles Schwab') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Matt.Korn@schwab.com'),
    (cid, 'Stacy.Sernabeecher@Schwab.com');

  -- Chevron
  INSERT INTO companies (name) VALUES ('Chevron') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'pamela@chevron.com');

  -- Citibank
  INSERT INTO companies (name) VALUES ('Citibank') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'bryan.rivera@citi.com');

  -- Cognizant
  INSERT INTO companies (name) VALUES ('Cognizant') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'cesar.palacios@cognizant.com');

  -- Credit One Bank
  INSERT INTO companies (name) VALUES ('Credit One Bank') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Michael.Whitley@creditonebank.com'),
    (cid, 'MWhitley@creditonebank.com');

  -- Dell Technologies
  INSERT INTO companies (name) VALUES ('Dell Technologies') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Rosie_Carrizal@dell.com'),
    (cid, 'Madison.Reid@dell.com'),
    (cid, 'campbell.ingraham@dell.com'),
    (cid, 'Prashant.Bhagavatula@dell.com');

  -- Deloitte
  INSERT INTO companies (name) VALUES ('Deloitte') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'mfeltmann@deloitte.com'),
    (cid, 'kyager@deloitte.com'),
    (cid, 'kpuls@deloitte.com');

  -- Disney
  INSERT INTO companies (name) VALUES ('Disney') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'jasmine.karamzadeh@disney.com');

  -- EOG Resources
  INSERT INTO companies (name) VALUES ('EOG Resources') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'brian_peterson@eogresources.com');

  -- ESPN
  INSERT INTO companies (name) VALUES ('ESPN') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'komal.desai@espn.com'),
    (cid, 'ava.soodek@espn.com'),
    (cid, 'jessica.stamp@espn.com');

  -- Expedia
  INSERT INTO companies (name) VALUES ('Expedia') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'dkundu@expediagroup.com'),
    (cid, 'sstruyk@expediagroup.com');

  -- Experian
  INSERT INTO companies (name) VALUES ('Experian') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'derek.ploor@experian.com'),
    (cid, 'madhu.katta@experian.com'),
    (cid, 'ken.tromer@experian.com');

  -- EY
  INSERT INTO companies (name) VALUES ('EY') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Valerie.King@ey.com'),
    (cid, 'Lisa.Fite@ey.com'),
    (cid, 'chris.c.uhlig@ey.com'),
    (cid, 'maricarolyn.stith@ey.com'),
    (cid, 'danielle.wilcher@ey.com'),
    (cid, 'maddie.castro@ey.com');

  -- Facebook / Meta
  INSERT INTO companies (name) VALUES ('Meta (Facebook)') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'crystalcao@fb.com');

  -- Fisher Investments
  INSERT INTO companies (name) VALUES ('Fisher Investments') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'h.thornton@fi.com');

  -- Ford
  INSERT INTO companies (name) VALUES ('Ford') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'agonzalez@ford.com');

  -- FTI Consulting
  INSERT INTO companies (name) VALUES ('FTI Consulting') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'William.kuo@FTIconsulting.com'),
    (cid, 'Leah.broderick@FTIconsulting.com'),
    (cid, 'John.knitter@FTIconsulting.com');

  -- GM
  INSERT INTO companies (name) VALUES ('GM') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Laura.Amo@gm.com');

  -- Goldman Sachs
  INSERT INTO companies (name) VALUES ('Goldman Sachs') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Jason.Kesten@gs.com'),
    (cid, 'justine.mutac@gs.com'),
    (cid, 'souphea.long@gs.com');

  -- Google
  INSERT INTO companies (name) VALUES ('Google') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'dcaponi@google.com');

  -- H-E-B
  INSERT INTO companies (name) VALUES ('H-E-B') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'thomas.sophie@heb.com');

  -- IBM
  INSERT INTO companies (name) VALUES ('IBM') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'bperez@us.ibm.com'),
    (cid, 'sangeetha.a@ibm.com'),
    (cid, 'ariellehurst@ibm.com'),
    (cid, 'sherman.dilworth@ibm.com');

  -- JP Morgan
  INSERT INTO companies (name) VALUES ('JP Morgan') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'michael.mathew@jpmchase.com'),
    (cid, 'linda.carrion@jpmchase.com'),
    (cid, 'Douglas.Einstein@jpmchase.com'),
    (cid, 'Lisl.stanton@jpmchase.com'),
    (cid, 'rabia.baig@jpmchase.com'),
    (cid, 'Nate.kuhn@jpmchase.com');

  -- Keurig Dr Pepper
  INSERT INTO companies (name) VALUES ('Keurig Dr Pepper') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Alicia.Love@kdrp.com');

  -- KPMG
  INSERT INTO companies (name) VALUES ('KPMG') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'BrittanyWalker@kpmg.com'),
    (cid, 'ChristineBetty@kpmg.com');

  -- Liberty Mutual
  INSERT INTO companies (name) VALUES ('Liberty Mutual') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Josiah.green@libertymutual.com');

  -- McKinsey & Company
  INSERT INTO companies (name) VALUES ('McKinsey & Company') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'kristina_briggs@mckinsey.com'),
    (cid, 'Erin_Henry@mckinsey.com'),
    (cid, 'sahil_maherali@mckinsey.com');

  -- Microsoft
  INSERT INTO companies (name) VALUES ('Microsoft') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'georgiaf@microsoft.com');

  -- Morgan Stanley
  INSERT INTO companies (name) VALUES ('Morgan Stanley') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'jennifer.pitzer@morganstanley.com'),
    (cid, 'theresa.alarcon@morganstanley.com');

  -- Nike
  INSERT INTO companies (name) VALUES ('Nike') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Alvin.Tai@nike.com');

  -- PepsiCo
  INSERT INTO companies (name) VALUES ('PepsiCo') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'elisa.black@pepsico.com'),
    (cid, 'Lexy.Argianas@pepsico.com'),
    (cid, 'John.Johnson2@pepsico.com'),
    (cid, 'Stefany.Alarcon@pepsico.com');

  -- Protiviti
  INSERT INTO companies (name) VALUES ('Protiviti') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Elizabeth.Kidney@protiviti.com'),
    (cid, 'Nicolas.garza@protiviti.com');

  -- PwC
  INSERT INTO companies (name) VALUES ('PwC') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Leighton.w.shaw@pwc.com'),
    (cid, 'lauren.thomas@pwc.com');

  -- RetailMeNot
  INSERT INTO companies (name) VALUES ('RetailMeNot') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'rveltidi@rmn.com');

  -- Shell
  INSERT INTO companies (name) VALUES ('Shell') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'garry.a.morehead@shell.com'),
    (cid, 'monica.hammack@shell.com'),
    (cid, 'claudia.m.martinez@shell.com');

  -- Siemens
  INSERT INTO companies (name) VALUES ('Siemens') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'victoria.matthews@siemens.com'),
    (cid, 'brian.schmidly@siemens.com'),
    (cid, 'haluk.kalin@siemens.com');

  -- Signify Health
  INSERT INTO companies (name) VALUES ('Signify Health') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Kpelano@signifyhealth.com');

  -- Southwest Airlines
  INSERT INTO companies (name) VALUES ('Southwest Airlines') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'Sophie.Vickers@wnco.com'),
    (cid, 'Grace.Kolzow@wnco.com');

  -- State Farm
  INSERT INTO companies (name) VALUES ('State Farm') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'ecantrell@statefarm.com');

  -- Starbucks
  INSERT INTO companies (name) VALUES ('Starbucks') RETURNING id INTO cid;

  -- Target
  INSERT INTO companies (name) VALUES ('Target') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Lauren.Wrobbel@target.com');

  -- Tesla
  INSERT INTO companies (name) VALUES ('Tesla') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'jthammavongsa@tesla.com'),
    (cid, 'mcornish@tesla.com'),
    (cid, 'saalvarez@tesla.com');

  -- Texas Instruments
  INSERT INTO companies (name) VALUES ('Texas Instruments') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 's-price@ti.com');

  -- The Home Depot
  INSERT INTO companies (name) VALUES ('The Home Depot') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'bria_benton@homedepot.com');

  -- T-Mobile
  INSERT INTO companies (name) VALUES ('T-Mobile') RETURNING id INTO cid;

  -- Truist Bank
  INSERT INTO companies (name) VALUES ('Truist Bank') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'ben.longo@truist.com'),
    (cid, 'will.matthews@truist.com'),
    (cid, 'alexis.jones@truist.com');

  -- TTI
  INSERT INTO companies (name) VALUES ('TTI') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Allie.McWilliams@ttigroupna.com');

  -- Under Armour
  INSERT INTO companies (name) VALUES ('Under Armour') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'ascott@underarmour.com');

  -- University Co-op
  INSERT INTO companies (name) VALUES ('University Co-op') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES
    (cid, 'weborder@universitycoop.com'),
    (cid, 'cphifer@universitycoop.com'),
    (cid, 'khanks@universitycoop.com');

  -- Verizon
  INSERT INTO companies (name) VALUES ('Verizon') RETURNING id INTO cid;

  -- Walmart
  INSERT INTO companies (name) VALUES ('Walmart') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'Lisa.Burin@walmart.com');

  -- Weaver
  INSERT INTO companies (name) VALUES ('Weaver') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'maddie.meade@weaver.com');

  -- Wells Fargo
  INSERT INTO companies (name) VALUES ('Wells Fargo') RETURNING id INTO cid;

  -- Whole Foods
  INSERT INTO companies (name) VALUES ('Whole Foods') RETURNING id INTO cid;
  INSERT INTO contacts (company_id, email) VALUES (cid, 'kim.vo@wholefoods.com');

END $$;
