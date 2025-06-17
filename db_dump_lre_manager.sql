--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ledger_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_entry (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vendor_name character varying NOT NULL,
    expense_description text NOT NULL,
    wbs_category character varying NOT NULL,
    wbs_subcategory character varying NOT NULL,
    baseline_date date,
    baseline_amount double precision,
    planned_date date,
    planned_amount double precision,
    actual_date date,
    actual_amount double precision,
    notes text,
    "programId" uuid,
    invoice_link_text text,
    invoice_link_url text
);


ALTER TABLE public.ledger_entry OWNER TO postgres;

--
-- Name: program; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.program (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    status character varying NOT NULL,
    "startDate" timestamp without time zone,
    "endDate" timestamp without time zone,
    "totalBudget" numeric(15,2) NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE public.program OWNER TO postgres;

--
-- Name: wbs_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wbs_category (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "programId" uuid
);


ALTER TABLE public.wbs_category OWNER TO postgres;

--
-- Name: wbs_subcategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wbs_subcategory (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "categoryId" uuid
);


ALTER TABLE public.wbs_subcategory OWNER TO postgres;

--
-- Data for Name: ledger_entry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ledger_entry (id, vendor_name, expense_description, wbs_category, wbs_subcategory, baseline_date, baseline_amount, planned_date, planned_amount, actual_date, actual_amount, notes, "programId", invoice_link_text, invoice_link_url) FROM stdin;
c319ef97-adf1-4618-8a61-e5936243458a	20921 Digi-Key Electronics, Inc. (US)	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-08-25	150000	2025-08-25	160000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
c2a0e8cc-4818-4e77-b548-1f0d02dd078c	20929 Radiation Test Solutions Inc	002: Consulting	1003: Other Direct Costs	002: Consulting	2025-07-25	15000	2025-07-25	15000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
b62a8eff-21a1-41d6-b881-4554fcf4144f	21653 CAST, INC ((RSS))	003: Licensing	1003: Other Direct Costs	003: Licensing	2025-01-23	22500	2025-01-23	22500	2025-01-23	22500	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
576c70b2-732c-4e93-a8f1-2b49e8da5a79	21153 Summit Interconnect	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-04-25	50000	2025-05-25	50000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
4a791086-7c1e-4f18-94e5-181169e2a033	21153 Summit Interconnect	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-09-25	50000	2025-09-25	50000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
c7149cc2-6ee2-42d5-8d8f-b1a5e7a167f6	21153 Summit Interconnect	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-09-25	40000	2025-10-25	40000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
abc2ff5c-4998-4a74-9987-f7854ab66585	21153 Summit Interconnect	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-09-25	10000	2025-11-25	10000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
20effa98-0ba3-4626-832e-12089885ff45	21102 J&J Machine Company, Inc.	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-09-25	15000	2025-10-25	15000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
6870bbb6-e940-421e-8117-343a75b335a0	21320 Texas Instruments	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-10-23	1999	2025-10-23	1999	2025-10-23	1999	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
846d5fdd-a69c-440b-87f7-e064cba66edf	21320 Texas Instruments	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-10-23	5998	2025-10-23	5998	2025-10-23	5998	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
faf2e7a7-a37d-4e3a-ad34-af55315f42d3	21844 HiTech Global	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-10-23	19780	2025-10-23	19780	2025-10-23	19780	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
b47c8a93-1cfd-4354-abb4-880c6564663d	21320 Texas Instruments	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-10-23	4360	2025-10-23	4360	2025-10-23	4360	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
58dc4e11-a246-4e05-9476-737b36faa121	21669 Polygon Design, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-09-25	20000	2025-09-25	20000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
23b7a4c3-fdd3-4a61-a4c1-155a59ccb3bd	21320 Texas Instruments	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-04-24	16966.62	2025-04-24	16966.62	2025-04-24	16966.62	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
62f41e16-5106-432c-9f45-ea970e4b4af8	21749 Celerity Embedded Design Service, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-07-25	60000	2025-07-25	60000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
0e070f41-730c-4b79-b6ed-3a54e158fd10	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-06-24	14707.5	2025-06-24	14707.5	2025-06-24	14707.5	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
f53cb27e-fb71-4bf5-a3eb-0dc547ac08f3	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-06-24	14615	2025-06-24	14615	2025-06-24	14615	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
7d3e3190-e6ac-4e9b-aa70-957a2c52b604	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-07-24	9897.5	2025-07-24	9897.5	2025-07-24	9897.5	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
3b565b8b-6a1a-4f1a-8199-749f8f2006f8	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-07-24	13320	2025-07-24	13320	2025-07-24	13320	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
8ffed3fb-f4da-4d51-8452-af8c3d92d203	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-08-24	12395	2025-08-24	12395	2025-08-24	12395	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
597b0d2b-bade-4681-87ed-ce3142c73bd5	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-08-24	5365	2025-08-24	5365	2025-08-24	5365	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
749c8e2c-87a6-45f5-864a-dd56c7688580	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-08-24	8140	2025-08-24	8140	2025-08-24	8140	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
e4e5eaf0-b47b-412e-a82c-d0eaa014a448	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-09-24	7122.5	2025-09-24	7122.5	2025-09-24	7122.5	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
e36a33a0-72b2-4235-8b5c-843413822057	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-09-24	6660	2025-09-24	6660	2025-09-24	6660	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
358837aa-13f8-441b-9dcc-88d70cc70e3c	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-10-24	7307.5	2025-10-24	7307.5	2025-10-24	7307.5	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
2c9c34bc-8187-4a7e-9dff-09cb958deb4d	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-10-24	6105	2025-10-24	6105	2025-10-24	6105	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
956be536-3dd2-4619-bf26-ac0ec89f449a	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-11-24	6706.25	2025-11-24	6706.25	2025-11-24	6706.25	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
13fca885-3d88-41cd-bf2b-ab84f57c054a	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-11-24	6197.5	2025-11-24	6197.5	2025-11-24	6197.5	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
a951a822-2bad-406a-8f51-f254cad14f36	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-12-24	4810	2025-12-24	4810	2025-12-24	4810	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
b27985de-a728-4a0a-8dd2-2780a63717cf	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-12-24	7492.5	2025-12-24	7492.5	2025-12-24	7492.5	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
8e704c44-e604-4c75-8234-eb4a8a511531	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-12-24	6567.5	2025-12-24	6567.5	2025-12-24	6567.5	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
943c4ea3-b09f-42be-ac18-263b035b81b7	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-02-25	12500	2025-03-25	12500	2025-03-25	9065	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
7cedf427-5671-4a9b-8abf-76db79306d5a	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-02-25	12500	2025-03-25	12500	2025-03-25	9690	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
01abd711-e8e5-4c70-8500-07224e5866e4	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-03-25	12500	2025-03-25	12500	2025-03-25	1295	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
e63e7b30-54c4-4280-b061-674b22ee6d1d	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-03-25	2000	2025-03-25	2000	2025-03-25	1710	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
928a2520-2a86-4a3c-9c98-f418e4712e77	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-03-25	9500	2025-03-25	9500	2025-03-25	6650	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
c85b2d27-3db2-45ba-9a1a-ed6a09c67422	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-03-25	12500	2025-04-25	12500	2025-04-25	9805	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
d14f6d69-c3cc-4113-a604-88f8e2412011	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-04-25	12500	2025-04-25	12500	2025-04-25	5735	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
bcd21d89-aefd-4885-967a-f6980008e28d	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-04-25	12500	2025-05-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
6ed7d098-8ecd-4e9c-9770-87bb519b2318	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-04-25	9500	2025-04-25	9500	2025-04-25	2850	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
c24ca02f-5972-4340-b345-cb1cc6e91cb9	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-05-25	12500	2025-05-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
279e560b-5e80-4120-9163-66a5a6476b26	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-05-25	12500	2025-05-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
530d29f5-036f-464d-b69c-4557897dcb14	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-05-25	9500	2025-05-25	9500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
9d07f6fd-0969-47dd-9d3b-96b56bb6af46	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-06-25	12500	2025-06-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
c38fe1a4-5cf3-40d4-822d-26cd5b7ad6e6	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-06-25	12500	2025-06-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
034c8fbd-4d16-417c-b623-08635434eb3b	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-06-25	9500	2025-06-25	9500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
3c7df500-c290-4c62-8426-56bc4c335bfd	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-07-25	12500	2025-07-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
b2f18cef-1de9-4de6-88db-967c56ed8db5	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-07-25	12500	2025-07-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
51750f3a-6aac-4087-bd25-5a01dfe5b5d2	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-08-25	12500	2025-08-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
8df1296c-53b1-44c0-b23b-0d201f15bfe8	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-08-25	12500	2025-08-25	12500	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
7807bcb7-5287-4c20-ab80-59b7852820a1	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-01-25	9065	2025-01-25	9065	2025-01-25	9065	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
52895777-bda6-41b0-b26b-d6d87e41a559	22482 E3 Designers, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-07-25	40000	2025-08-25	40000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
ef574975-e368-429c-a514-26fba9a67504	22482 E3 Designers, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-07-25	20000	2025-09-25	20000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
032c0e9d-5856-4ee6-8224-17fbd46ab97e	22482 E3 Designers, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-08-25	10000	2025-08-25	10000	\N	\N	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
3a7bf7b2-3886-4ecc-a1ca-bc3b521ec9c1	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-02-25	10175	2025-02-25	10175	2025-02-25	10175	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
7d7ce716-5c98-4eb1-91be-c16aa2300ece	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-02-25	12857.5	2025-02-25	12857.5	2025-02-25	12857.5	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
3aaf85ad-28c3-4c00-9670-f070a7147f6e	20920 Mouser Electronics	002: Test Equipment	1002: Direct Material Cost	002: Test Equipment	2025-03-25	\N	2025-03-25	\N	2025-03-25	2614.92	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
2266b7a6-adce-4113-8903-412ff2567cbf	22687 Innovative Sensing Solutions LLC	002: Consulting	1003: Other Direct Costs	002: Consulting	2025-04-25	\N	2025-04-25	\N	2025-04-25	4575	\N	ed18caf0-3d1d-4920-aab7-332c81f367c2	\N	\N
\.


--
-- Data for Name: program; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.program (id, code, name, description, status, "startDate", "endDate", "totalBudget", type) FROM stdin;
ed18caf0-3d1d-4920-aab7-332c81f367c2	CDP.5103	NASA SBIR	Building the ARENA 542	Active	2023-01-01 00:00:00	2026-07-30 00:00:00	749772.00	Period of Performance
\.


--
-- Data for Name: wbs_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wbs_category (id, name, "programId") FROM stdin;
\.


--
-- Data for Name: wbs_subcategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wbs_subcategory (id, name, "categoryId") FROM stdin;
\.


--
-- Name: ledger_entry PK_04e9d274911f909a5848a15cd74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entry
    ADD CONSTRAINT "PK_04e9d274911f909a5848a15cd74" PRIMARY KEY (id);


--
-- Name: program PK_3bade5945afbafefdd26a3a29fb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program
    ADD CONSTRAINT "PK_3bade5945afbafefdd26a3a29fb" PRIMARY KEY (id);


--
-- Name: wbs_category PK_5df28f7dc4baaa36d9db6cca9da; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_category
    ADD CONSTRAINT "PK_5df28f7dc4baaa36d9db6cca9da" PRIMARY KEY (id);


--
-- Name: wbs_subcategory PK_c7bf1ad522eb3b7ee0735044eeb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_subcategory
    ADD CONSTRAINT "PK_c7bf1ad522eb3b7ee0735044eeb" PRIMARY KEY (id);


--
-- Name: program UQ_c6b8c4c1adba14ec96387d3c002; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program
    ADD CONSTRAINT "UQ_c6b8c4c1adba14ec96387d3c002" UNIQUE (code);


--
-- Name: wbs_subcategory FK_1962bb25485545daadf8423c4a6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_subcategory
    ADD CONSTRAINT "FK_1962bb25485545daadf8423c4a6" FOREIGN KEY ("categoryId") REFERENCES public.wbs_category(id) ON DELETE CASCADE;


--
-- Name: wbs_category FK_cda95b96470bbbcc2d6b839b66e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_category
    ADD CONSTRAINT "FK_cda95b96470bbbcc2d6b839b66e" FOREIGN KEY ("programId") REFERENCES public.program(id) ON DELETE CASCADE;


--
-- Name: ledger_entry FK_db12061a0c731def9ccb76593f5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entry
    ADD CONSTRAINT "FK_db12061a0c731def9ccb76593f5" FOREIGN KEY ("programId") REFERENCES public.program(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

