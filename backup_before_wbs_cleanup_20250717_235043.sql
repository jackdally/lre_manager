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


--
-- Name: import_session_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.import_session_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'replaced'
);


ALTER TYPE public.import_session_status_enum OWNER TO postgres;

--
-- Name: import_transaction_duplicatetype_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.import_transaction_duplicatetype_enum AS ENUM (
    'none',
    'exact_duplicate',
    'different_info_confirmed',
    'different_info_pending',
    'original_rejected',
    'no_invoice_potential',
    'multiple_potential'
);


ALTER TYPE public.import_transaction_duplicatetype_enum OWNER TO postgres;

--
-- Name: import_transaction_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.import_transaction_status_enum AS ENUM (
    'unmatched',
    'matched',
    'confirmed',
    'rejected',
    'added_to_ledger',
    'replaced'
);


ALTER TYPE public.import_transaction_status_enum OWNER TO postgres;

--
-- Name: update_wbs_element_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_wbs_element_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_wbs_element_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: import_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    "columnMapping" json NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "programId" uuid,
    "isGlobal" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.import_config OWNER TO postgres;

--
-- Name: import_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_session (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    filename character varying NOT NULL,
    "originalFilename" character varying NOT NULL,
    description text NOT NULL,
    status public.import_session_status_enum DEFAULT 'pending'::public.import_session_status_enum NOT NULL,
    "totalRecords" integer DEFAULT 0 NOT NULL,
    "processedRecords" integer DEFAULT 0 NOT NULL,
    "matchedRecords" integer DEFAULT 0 NOT NULL,
    "unmatchedRecords" integer DEFAULT 0 NOT NULL,
    "errorRecords" integer DEFAULT 0 NOT NULL,
    "importConfig" json,
    results json,
    "errorMessage" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "programId" uuid,
    "replacedBySessionId" uuid
);


ALTER TABLE public.import_session OWNER TO postgres;

--
-- Name: import_transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_transaction (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "vendorName" character varying NOT NULL,
    description text NOT NULL,
    amount numeric(15,2) NOT NULL,
    "transactionDate" date NOT NULL,
    "programCode" character varying,
    category character varying,
    subcategory character varying,
    "invoiceNumber" character varying,
    "referenceNumber" character varying,
    "rawData" json,
    status public.import_transaction_status_enum DEFAULT 'unmatched'::public.import_transaction_status_enum NOT NULL,
    "matchConfidence" numeric(3,2),
    "suggestedMatches" json,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "importSessionId" uuid,
    "matchedLedgerEntryId" uuid,
    "duplicateType" public.import_transaction_duplicatetype_enum DEFAULT 'none'::public.import_transaction_duplicatetype_enum NOT NULL,
    "duplicateOfId" uuid,
    "preservedFromSessionId" uuid,
    "transactionId" character varying
);


ALTER TABLE public.import_transaction OWNER TO postgres;

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
    invoice_link_url text,
    "wbsElementId" uuid
);


ALTER TABLE public.ledger_entry OWNER TO postgres;

--
-- Name: potential_match; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.potential_match (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    confidence double precision,
    status character varying(20) DEFAULT 'potential'::character varying NOT NULL,
    reasons text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "transactionId" uuid,
    "ledgerEntryId" uuid
);


ALTER TABLE public.potential_match OWNER TO postgres;

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
    type character varying NOT NULL,
    program_manager character varying
);


ALTER TABLE public.program OWNER TO postgres;

--
-- Name: rejected_match; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rejected_match (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "transactionId" uuid,
    "ledgerEntryId" uuid
);


ALTER TABLE public.rejected_match OWNER TO postgres;

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
-- Name: wbs_element; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wbs_element (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    level integer NOT NULL,
    "parentId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "programId" uuid
);


ALTER TABLE public.wbs_element OWNER TO postgres;

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
-- Name: wbs_template; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wbs_template (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wbs_template OWNER TO postgres;

--
-- Name: wbs_template_element; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wbs_template_element (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    level integer NOT NULL,
    "parentId" uuid,
    "templateId" uuid
);


ALTER TABLE public.wbs_template_element OWNER TO postgres;

--
-- Data for Name: import_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_config (id, name, description, "columnMapping", "isDefault", "createdAt", "updatedAt", "programId", "isGlobal") FROM stdin;
5f7c97bb-1040-4ec7-82ee-32bc59fd1f3e	JTD - All S&S Program Bills	This is the report that includes all program bills from NetSuite	{"programCodeColumn":"Program Code","vendorColumn":"Vendor ID","descriptionColumn":"Memo (Main)","amountColumn":"Adjusted Amount for LRE","dateColumn":"Date","categoryColumn":"","subcategoryColumn":"","invoiceColumn":"Document Number","referenceColumn":"","dateFormat":"MM/DD/YYYY","amountTolerance":0.01,"matchThreshold":0.7,"periodColumn":"Period","transactionIdColumn":"Internal ID"}	t	2025-06-23 16:12:13.281014	2025-06-23 16:12:13.281	\N	t
\.


--
-- Data for Name: import_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_session (id, filename, "originalFilename", description, status, "totalRecords", "processedRecords", "matchedRecords", "unmatchedRecords", "errorRecords", "importConfig", results, "errorMessage", "createdAt", "updatedAt", "programId", "replacedBySessionId") FROM stdin;
670cb82e-b918-463b-a67e-17f959371a77	/tmp/da17968e9cf16830683f15d2c7983ccd	JTDAllSSProgramBillsResults804.xls	June 2025 - Take 1	completed	7371	35	8	27	0	{"programCodeColumn":"Program Code","vendorColumn":"Vendor ID","descriptionColumn":"Memo (Main)","amountColumn":"Adjusted Amount for LRE","dateColumn":"Date","categoryColumn":"","subcategoryColumn":"","invoiceColumn":"Document Number","referenceColumn":"","dateFormat":"MM/DD/YYYY","amountTolerance":0.01,"matchThreshold":0.7,"periodColumn":"Period","transactionIdColumn":"Internal ID"}	\N	\N	2025-07-08 03:20:12.397731	2025-07-08 03:20:14.398326	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N
\.


--
-- Data for Name: import_transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_transaction (id, "vendorName", description, amount, "transactionDate", "programCode", category, subcategory, "invoiceNumber", "referenceNumber", "rawData", status, "matchConfidence", "suggestedMatches", "createdAt", "importSessionId", "matchedLedgerEntryId", "duplicateType", "duplicateOfId", "preservedFromSessionId", "transactionId") FROM stdin;
603b101e-4ce1-46a0-913c-9a2b3a64dec9	20921 Digi-Key Electronics, Inc. (US)	Christopher Scott - POUS-214	14573.79	2025-06-16	CDP.5103	\N	\N	RAMP.1ecb79e7-5ea7-4f86-b38b-377da58977a4	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=541107	{"Internal ID":541107,"Date":45824,"Created By":"30398 MR Muir","Date Created":45827.479166666664,"Period":"Jun 2025","Type":"Credit Card","Approval Status":"","Document Number":"RAMP.1ecb79e7-5ea7-4f86-b38b-377da58977a4","Vendor ID":"20921 Digi-Key Electronics, Inc. (US)","Vendor Entity ID":"20921","Vendor Name":"Digi-Key Electronics, Inc. (US)","Account":"15105 FIXED ASSETS : FA COST : Computers and Software","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Christopher Scott - POUS-214","Memo":"Christopher Scott - POUS-214","Adjusted Amount for LRE":14573.79,"Amount":14573.79,"Amount (Debit)":14573.79,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":14573.79,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	541107
81f3b255-21c9-4336-86d3-c6186832a954	22676 Advanced Assembly, LLC	PCB manufacturing and assembly invoice with tax details	1500.00	2025-05-28	CDP.5103	\N	\N	69228	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=530913	{"Internal ID":530913,"Date":45805,"Created By":"30398 MR Muir","Date Created":45811.347916666666,"Period":"May 2025","Type":"Bill","Approval Status":"Approved","Document Number":"69228","Vendor ID":"22676 Advanced Assembly, LLC","Vendor Entity ID":"22676","Vendor Name":"Advanced Assembly, LLC","Account":"13801 OTHER CURRENT ASSETS : INVENTORY : Arena Inventory","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"PCB manufacturing and assembly invoice with tax details","Memo":"Extra Services - AS9102 Cert","Adjusted Amount for LRE":1500,"Amount":1500,"Amount (Debit)":1500,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":1500,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	530913
6c07c831-7424-40ed-8f7d-3f27bfa40fea	21880 DesignLinx Hardware Solutions, Inc.	FPGA support and embedded software consulting services	9595.00	2025-06-02	CDP.5103	\N	\N	INV-3915	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=532040	{"Internal ID":532040,"Date":45810,"Created By":"30398 MR Muir","Date Created":45811.595138888886,"Period":"Jun 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3915","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA support and embedded software consulting services","Memo":"Line Item #1 Embedded Software Engineering Consulting Services SOW#3 (05/16/25-05/31/25)","Adjusted Amount for LRE":9595,"Amount":9595,"Amount (Debit)":9595,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":9595,"Amount (Credit) (Foreign Currency)":0}	matched	0.80	[{"id":"24a48c12-140b-4cad-8b7a-0abb98073a5b","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":9500,"planned_date":"2025-06-01","confidence":0.8014851485148514,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"16178618-fc11-4817-9a80-71427f205ec9","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"ac31c4a1-0958-44dc-90d5-8d8ad6b14a31","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]}]	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	532040
4bf72ac6-1bda-4f97-80ab-d2c8f2429959	22676 Advanced Assembly, LLC	PCB manufacturing and assembly invoice with tax details	195.00	2025-05-28	CDP.5103	\N	\N	69228	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=530913	{"Internal ID":530913,"Date":45805,"Created By":"30398 MR Muir","Date Created":45811.347916666666,"Period":"May 2025","Type":"Bill","Approval Status":"Approved","Document Number":"69228","Vendor ID":"22676 Advanced Assembly, LLC","Vendor Entity ID":"22676","Vendor Name":"Advanced Assembly, LLC","Account":"13801 OTHER CURRENT ASSETS : INVENTORY : Arena Inventory","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"PCB manufacturing and assembly invoice with tax details","Memo":"Assembly Testing - X-Ray","Adjusted Amount for LRE":195,"Amount":195,"Amount (Debit)":195,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":195,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	530913
26b1a1c9-f947-4543-ad1f-29b3ae64db4d	22676 Advanced Assembly, LLC	PCB manufacturing and assembly invoice with tax details	660.00	2025-05-28	CDP.5103	\N	\N	69228	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=530913	{"Internal ID":530913,"Date":45805,"Created By":"30398 MR Muir","Date Created":45811.347916666666,"Period":"May 2025","Type":"Bill","Approval Status":"Approved","Document Number":"69228","Vendor ID":"22676 Advanced Assembly, LLC","Vendor Entity ID":"22676","Vendor Name":"Advanced Assembly, LLC","Account":"13801 OTHER CURRENT ASSETS : INVENTORY : Arena Inventory","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"PCB manufacturing and assembly invoice with tax details","Memo":"Setup","Adjusted Amount for LRE":660,"Amount":660,"Amount (Debit)":660,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":660,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	530913
22d946e7-8961-4cd4-8904-08a583798b74	22676 Advanced Assembly, LLC	PCB manufacturing and assembly invoice with tax details	53167.26	2025-05-28	CDP.5103	\N	\N	69228	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=530913	{"Internal ID":530913,"Date":45805,"Created By":"30398 MR Muir","Date Created":45811.347916666666,"Period":"May 2025","Type":"Bill","Approval Status":"Approved","Document Number":"69228","Vendor ID":"22676 Advanced Assembly, LLC","Vendor Entity ID":"22676","Vendor Name":"Advanced Assembly, LLC","Account":"23100 OTHER LIABILITIES : Accrued Expenses","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"PCB manufacturing and assembly invoice with tax details","Memo":"Billing QTY 5 - Boards, Components & Assembly","Adjusted Amount for LRE":53167.26,"Amount":-53167.26,"Amount (Debit)":53167.26,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":53167.26,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	530913
18c94847-735e-4151-9a2f-d4b976f9a95f	21880 DesignLinx Hardware Solutions, Inc.	Engineering support services invoice for FPGA design	9250.00	2025-05-16	CDP.5103	\N	\N	INV-3907	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=521784	{"Internal ID":521784,"Date":45793,"Created By":"30398 MR Muir","Date Created":45797.4,"Period":"May 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3907","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Engineering support services invoice for FPGA design","Memo":"Sr. FPGA Design Engineer (05/01/25-05/15/25)","Adjusted Amount for LRE":9250,"Amount":9250,"Amount (Debit)":9250,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":9250,"Amount (Credit) (Foreign Currency)":0}	confirmed	0.80	[{"id":"c6b2743f-14e8-47fa-92de-042fc4ee0794","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-05-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"795c956c-2073-483d-9d4d-b88dba8b4d15","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":9500,"planned_date":"2025-05-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]}]	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	795c956c-2073-483d-9d4d-b88dba8b4d15	none	\N	\N	521784
16b4af8c-8f68-4ea2-8ff2-d7d688bebe29	21880 DesignLinx Hardware Solutions, Inc.	Sr. FPGA Design & Support professional service invoice	5735.00	2025-04-16	CDP.5103	\N	\N	INV-3879	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=511686	{"Internal ID":511686,"Date":45763,"Created By":"30398 MR Muir","Date Created":45778.39375,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3879","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"NASA - SpaceQualDigRx Phase 2_80NSSC210452","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"Golden","Memo (Main)":"Sr. FPGA Design & Support professional service invoice","Memo":"Sr. FPGA Design & Support (04/01/25-04/15/25) SOW#2","Adjusted Amount for LRE":5735,"Amount":5735,"Amount (Debit)":5735,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":5735,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	511686
171b1dbc-5be1-495b-b0c8-decc50617eda	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	125.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"MegaMezz Support","Adjusted Amount for LRE":125,"Amount":125,"Amount (Debit)":125,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":125,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
87f4e35d-9e85-4989-a564-6d70be66f477	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	1500.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"Mega Mezz System Design Dcoument and System Requirements Document Review","Adjusted Amount for LRE":1500,"Amount":1500,"Amount (Debit)":1500,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":1500,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
8f4841fc-4ab6-42e8-9281-a3b0500b3fed	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	250.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"Meeting with Brad Taber","Adjusted Amount for LRE":250,"Amount":250,"Amount (Debit)":250,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":250,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
0d6aa4f2-553c-41b7-b56c-d35d2430b1f1	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	250.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"Mega Mezz System Design Document Review","Adjusted Amount for LRE":250,"Amount":250,"Amount (Debit)":250,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":250,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
5a92ad63-52e8-4be9-8f25-2d3f1a889ba6	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	500.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"Mega Mezz System Design Document Review","Adjusted Amount for LRE":500,"Amount":500,"Amount (Debit)":500,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":500,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
a33f994c-2b65-40e3-a9e8-37e70c284c28	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	500.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"Mega Mezz System Design Document Review","Adjusted Amount for LRE":500,"Amount":500,"Amount (Debit)":500,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":500,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
cf6ba256-b7cb-4c1a-b361-98f6613c9d4d	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	625.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"Mega Mezz System Design Document Review","Adjusted Amount for LRE":625,"Amount":625,"Amount (Debit)":625,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":625,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
a907d1fe-9151-4568-8705-ae1c21302724	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	75.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"Meeting with Francesc","Adjusted Amount for LRE":75,"Amount":75,"Amount (Debit)":75,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":75,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
3cd5852f-3d19-4589-9c69-4ecc815edc48	22687 Innovative Sensing Solutions LLC	Consulting and support services invoice, various engineering activities	750.00	2025-04-11	CDP.5103	\N	\N	000109	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=506227	{"Internal ID":506227,"Date":45758,"Created By":"30398 MR Muir","Date Created":45772.37152777778,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"000109","Vendor ID":"22687 Innovative Sensing Solutions LLC","Vendor Entity ID":"22687","Vendor Name":"Innovative Sensing Solutions LLC","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Consulting and support services invoice, various engineering activities","Memo":"Mega Mezz System Requirements Document Review","Adjusted Amount for LRE":750,"Amount":750,"Amount (Debit)":750,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":750,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	506227
5d91c4ce-3582-45da-845e-28a8a98eb5b6	21880 DesignLinx Hardware Solutions, Inc.	Sr. FPGA Design & Support services	9805.00	2025-04-01	CDP.5103	\N	\N	INV-3867	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=511178	{"Internal ID":511178,"Date":45748,"Created By":"30398 MR Muir","Date Created":45778.37986111111,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3867","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"NASA - SpaceQualDigRx Phase 2_80NSSC210452","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"Golden","Memo (Main)":"Sr. FPGA Design & Support services","Memo":"Sr. FPGA Design & Support (03/16/25-03/31/25) SOW#2","Adjusted Amount for LRE":9805,"Amount":9805,"Amount (Debit)":9805,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":9805,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	511178
6f8592c6-ba5d-4c2f-8a00-436b35f2ed2b	21880 DesignLinx Hardware Solutions, Inc.	FPGA and embedded software engineering consulting services	2850.00	2025-04-01	CDP.5103	\N	\N	INV-3868	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=511791	{"Internal ID":511791,"Date":45748,"Created By":"30398 MR Muir","Date Created":45778.489583333336,"Period":"Apr 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3868","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA and embedded software engineering consulting services","Memo":"Line Item #1 Embedded Software Engineering Consulting Services SOW#3 (03/18/25-03/24/25)","Adjusted Amount for LRE":2850,"Amount":2850,"Amount (Debit)":2850,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":2850,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	511791
cbe960da-7ae3-4a5e-845f-c1cd9f439395	20920 Mouser Electronics	Marie Rose Muir - POUS-81	2614.92	2025-03-21	CDP.5103	\N	\N	RAMP.51289a4d-bbc6-4e08-adae-0199b9afdcdb	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=494113	{"Internal ID":494113,"Date":45737,"Created By":"30398 MR Muir","Date Created":45749.68958333333,"Period":"Mar 2025","Type":"Credit Card","Approval Status":"","Document Number":"RAMP.51289a4d-bbc6-4e08-adae-0199b9afdcdb","Vendor ID":"20920 Mouser Electronics","Vendor Entity ID":"20920","Vendor Name":"Mouser Electronics","Account":"62709 PROJECT FEES & CONSULTING : Materials/Testing Items","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Marie Rose Muir - POUS-81","Memo":"Marie Rose Muir - POUS-81","Adjusted Amount for LRE":2614.92,"Amount":2614.92,"Amount (Debit)":2614.92,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":2614.92,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	494113
4530ebaf-6e6f-412c-9755-20db73d2a750	21880 DesignLinx Hardware Solutions, Inc.	Embedded Software Support services for FPGA	1710.00	2025-03-18	CDP.5103	\N	\N	INV-3858	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=487815	{"Internal ID":487815,"Date":45734,"Created By":"30398 MR Muir","Date Created":45742.60763888889,"Period":"Mar 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3858","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"Golden","Memo (Main)":"Embedded Software Support services for FPGA","Memo":"Embedded Software Support (03/04/25-03/05/24) SOW#3","Adjusted Amount for LRE":1710,"Amount":1710,"Amount (Debit)":1710,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":1710,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	487815
8abcb459-4d06-470d-b07c-1eb3c0652f0b	21880 DesignLinx Hardware Solutions, Inc.	FPGA Support and Embedded Software Engineering Consulting Services	6650.00	2025-03-18	CDP.5103	\N	\N	INV-3859	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=488384	{"Internal ID":488384,"Date":45734,"Created By":"30398 MR Muir","Date Created":45743.36736111111,"Period":"Mar 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3859","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA Support and Embedded Software Engineering Consulting Services","Memo":"Line Item #1 Embedded Software Engineering Consulting Services SOW#3 (03/05/25-03/17/25)","Adjusted Amount for LRE":6650,"Amount":6650,"Amount (Debit)":6650,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":6650,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	488384
371c5752-4692-40e8-b4ac-b7d9f5ff9b45	21880 DesignLinx Hardware Solutions, Inc.	FPGA Design & Support services	1295.00	2025-03-17	CDP.5103	\N	\N	INV-3854	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=487814	{"Internal ID":487814,"Date":45733,"Created By":"30398 MR Muir","Date Created":45742.603472222225,"Period":"Mar 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3854","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"Golden","Memo (Main)":"FPGA Design & Support services","Memo":"Sr. FPGA Design & Support (03/01/25-03/15/25) SOW#2","Adjusted Amount for LRE":1295,"Amount":1295,"Amount (Debit)":1295,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":1295,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	487814
72d01fbc-ac43-4f90-b97f-07847e3fe03f	21880 DesignLinx Hardware Solutions, Inc.	Sr. FPGA Design & Support services	9065.00	2025-03-04	CDP.5103	\N	\N	INV-3838	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=480282	{"Internal ID":480282,"Date":45720,"Created By":"30398 MR Muir","Date Created":45728.30694444444,"Period":"Mar 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3838","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Sr. FPGA Design & Support services","Memo":"Sr. FPGA Design & Support (02/16/25-02/28/25) SOW#2","Adjusted Amount for LRE":9065,"Amount":9065,"Amount (Debit)":9065,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":9065,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	480282
827bd9ab-bc35-46b0-840b-b746dd16fb81	21880 DesignLinx Hardware Solutions, Inc.	FPGA Support and Embedded Software Support services	9690.00	2025-03-04	CDP.5103	\N	\N	INV-3839	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=485800	{"Internal ID":485800,"Date":45720,"Created By":"30398 MR Muir","Date Created":45741.38888888889,"Period":"Mar 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3839","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"Golden","Memo (Main)":"FPGA Support and Embedded Software Support services","Memo":"Embedded Software Support (02/16/25-02/28/25) SOW#3","Adjusted Amount for LRE":9690,"Amount":9690,"Amount (Debit)":9690,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":9690,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	485800
0007907e-0d6b-408f-85f6-7a1e268d0743	21880 DesignLinx Hardware Solutions, Inc.	Sr. FPGA Design & Support services	12857.50	2025-02-17	CDP.5103	\N	\N	INV-3829	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=469106	{"Internal ID":469106,"Date":45705,"Created By":"30398 MR Muir","Date Created":45706.64166666667,"Period":"Feb 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3829","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"NASA - SpaceQualDigRx Phase 2_80NSSC210452","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"Golden","Memo (Main)":"Sr. FPGA Design & Support services","Memo":"Sr. FPGA Design & Support (02/01/25-02/15/25) SOW#2","Adjusted Amount for LRE":12857.5,"Amount":12857.5,"Amount (Debit)":12857.5,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":12857.5,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	469106
5b2c0ef5-35ea-407d-a6a7-eb001d145082	21880 DesignLinx Hardware Solutions, Inc.	FPGA Design and Support Services	10175.00	2025-02-04	CDP.5103	\N	\N	INV-3822	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=466419	{"Internal ID":466419,"Date":45692,"Created By":"30398 MR Muir","Date Created":45700.59652777778,"Period":"Feb 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3822","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"NASA - SpaceQualDigRx Phase 2_80NSSC210452","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"Golden","Memo (Main)":"FPGA Design and Support Services","Memo":"Sr. FPGA Design & Support (01/16/25-01/31/25) SOW#2","Adjusted Amount for LRE":10175,"Amount":10175,"Amount (Debit)":10175,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":10175,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	466419
c42caa3e-7fe2-4ab9-8b83-bd86dfc9a319	21880 DesignLinx Hardware Solutions, Inc.	FPGA Design and Support Services	9065.00	2025-01-17	CDP.5103	\N	\N	INV -3810	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=456554	{"Internal ID":456554,"Date":45674,"Created By":"30398 MR Muir","Date Created":45688.42013888889,"Period":"Jan 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV -3810","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA Design and Support Services","Memo":"Sr. FPGA Design & Support (01/01/25-01/15/25) SOW#2","Adjusted Amount for LRE":9065,"Amount":9065,"Amount (Debit)":9065,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":9065,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	456554
f3aa975c-a594-4a6c-89f3-7aa0397290c1	21880 DesignLinx Hardware Solutions, Inc.	FPGA Design and Support Services	6567.50	2024-12-30	CDP.5103	\N	\N	INV-3796	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=452876	{"Internal ID":452876,"Date":45656,"Created By":"30398 MR Muir","Date Created":45681.63055555556,"Period":"Jan 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3796","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"13502 OTHER CURRENT ASSETS : PREPAIDS : Prepaid Expenses","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA Design and Support Services","Memo":"Sr. FPGA Design & Support (12/16/24-12/31/24) SOW#2","Adjusted Amount for LRE":6567.5,"Amount":6567.5,"Amount (Debit)":6567.5,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":6567.5,"Amount (Credit) (Foreign Currency)":0}	unmatched	\N	\N	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	452876
ef2b2c89-527a-46fb-aedb-20760101503a	21880 DesignLinx Hardware Solutions, Inc.	FPGA engineering services invoice for May 2025 period	13320.00	2025-06-02	CDP.5103	\N	\N	INV-3916	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=532039	{"Internal ID":532039,"Date":45810,"Created By":"30398 MR Muir","Date Created":45811.59166666667,"Period":"Jun 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3916","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA engineering services invoice for May 2025 period","Memo":"Sr. FPGA Design Engineer (05/16/25-05/31/25)","Adjusted Amount for LRE":13320,"Amount":13320,"Amount (Debit)":13320,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":13320,"Amount (Credit) (Foreign Currency)":0}	matched	0.80	[{"id":"16178618-fc11-4817-9a80-71427f205ec9","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"ac31c4a1-0958-44dc-90d5-8d8ad6b14a31","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"24a48c12-140b-4cad-8b7a-0abb98073a5b","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":9500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]}]	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	532039
881370f3-a00b-492f-8f98-e313723512a1	21880 DesignLinx Hardware Solutions, Inc.	FPGA and embedded software engineering consulting services	11685.00	2025-05-16	CDP.5103	\N	\N	INV-3906	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=521783	{"Internal ID":521783,"Date":45793,"Created By":"30398 MR Muir","Date Created":45797.39861111111,"Period":"May 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3906","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA and embedded software engineering consulting services","Memo":"Line Item #1 Embedded Software Engineering Consulting Services SOW#3 (05/01/25-05/15/25)","Adjusted Amount for LRE":11685,"Amount":11685,"Amount (Debit)":11685,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":11685,"Amount (Credit) (Foreign Currency)":0}	matched	0.80	[{"id":"c6b2743f-14e8-47fa-92de-042fc4ee0794","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-05-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"795c956c-2073-483d-9d4d-b88dba8b4d15","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":9500,"planned_date":"2025-05-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]}]	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	521783
b4d6edb6-ca84-4b21-8560-bf2efc024576	21880 DesignLinx Hardware Solutions, Inc.	FPGA design engineering support services invoice	5642.50	2025-05-06	CDP.5103	\N	\N	INV-3893	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=518227	{"Internal ID":518227,"Date":45783,"Created By":"30398 MR Muir","Date Created":45789.373611111114,"Period":"May 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3893","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA design engineering support services invoice","Memo":"Sr. FPGA Design Engineer (04/24/25-04/30/25)","Adjusted Amount for LRE":5642.5,"Amount":5642.5,"Amount (Debit)":5642.5,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":5642.5,"Amount (Credit) (Foreign Currency)":0}	confirmed	0.80	[{"id":"c6b2743f-14e8-47fa-92de-042fc4ee0794","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-05-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"795c956c-2073-483d-9d4d-b88dba8b4d15","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":9500,"planned_date":"2025-05-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]}]	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	c6b2743f-14e8-47fa-92de-042fc4ee0794	none	\N	\N	518227
f9de65b5-c41d-47a2-89d3-1f06f8d8b06d	21880 DesignLinx Hardware Solutions, Inc.	FPGA design and support services invoice	8510.00	2025-05-02	CDP.5103	\N	\N	INV-3889	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=513846	{"Internal ID":513846,"Date":45779,"Created By":"30398 MR Muir","Date Created":45782.33888888889,"Period":"May 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3889","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"FPGA design and support services invoice","Memo":"Sr. FPGA Design & Support (04/16/25-04/30/25) SOW#2","Adjusted Amount for LRE":8510,"Amount":8510,"Amount (Debit)":8510,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":8510,"Amount (Credit) (Foreign Currency)":0}	matched	0.80	[{"id":"c6b2743f-14e8-47fa-92de-042fc4ee0794","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-05-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"795c956c-2073-483d-9d4d-b88dba8b4d15","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":9500,"planned_date":"2025-05-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]}]	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	513846
c6d041b6-ba99-4a01-9fe0-d8d18e09435f	21880 DesignLinx Hardware Solutions, Inc.	Invoice for FPGA Support services. (06/01/25-06/15/25)	14800.00	2025-06-16	CDP.5103	\N	\N	INV-3926	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=539055	{"Internal ID":539055,"Date":45824,"Created By":"30398 MR Muir","Date Created":45825.677777777775,"Period":"Jun 2025","Type":"Bill","Approval Status":"Pending Approval","Document Number":"INV-3926","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Invoice for FPGA Support services. (06/01/25-06/15/25)","Memo":"Sr. FPGA Design Engineer (06/01/25-06/15/25)","Adjusted Amount for LRE":14800,"Amount":14800,"Amount (Debit)":14800,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":14800,"Amount (Credit) (Foreign Currency)":0}	matched	0.80	[{"id":"16178618-fc11-4817-9a80-71427f205ec9","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"ac31c4a1-0958-44dc-90d5-8d8ad6b14a31","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"24a48c12-140b-4cad-8b7a-0abb98073a5b","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":9500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]}]	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	539055
d7f36590-12bb-4991-be0c-9b74efe9210a	21880 DesignLinx Hardware Solutions, Inc.	Invoice for FPGA support and embedded software engineering consulting services.  (06/01/25-06/11/25)	7220.00	2025-06-16	CDP.5103	\N	\N	INV-3927	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=539158	{"Internal ID":539158,"Date":45824,"Created By":"30398 MR Muir","Date Created":45825.72083333333,"Period":"Jun 2025","Type":"Bill","Approval Status":"Approved","Document Number":"INV-3927","Vendor ID":"21880 DesignLinx Hardware Solutions, Inc.","Vendor Entity ID":"21880","Vendor Name":"DesignLinx Hardware Solutions, Inc.","Account":"62705 PROJECT FEES & CONSULTING : Third Party Consultants","Subsidiary (no hierarchy)":"Tomorrow.io US","Department (no hierarchy)":"S&S - ARENA Programs","Budget Code (no hierarchy)":"None","Program Code":"CDP.5103 - NASA SBIR Phase 2","Location (no hierarchy)":"","Memo (Main)":"Invoice for FPGA support and embedded software engineering consulting services.  (06/01/25-06/11/25)","Memo":"Line Item #1 Embedded Software Engineering Consulting Services SOW#3 (06/01/25-06/11/25)","Adjusted Amount for LRE":7220,"Amount":7220,"Amount (Debit)":7220,"Amount (Credit)":0,"Currency":"USD","Amount (Debit) (Foreign Currency)":7220,"Amount (Credit) (Foreign Currency)":0}	matched	0.80	[{"id":"16178618-fc11-4817-9a80-71427f205ec9","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"ac31c4a1-0958-44dc-90d5-8d8ad6b14a31","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":12500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]},{"id":"24a48c12-140b-4cad-8b7a-0abb98073a5b","vendorName":"21880 DesignLinx Hardware Solutions, Inc.","description":"001: Firmware","planned_amount":9500,"planned_date":"2025-06-01","confidence":0.8,"matchType":"fuzzy","reasons":["Exact vendor name match"]}]	2025-07-08 03:20:14.073871	670cb82e-b918-463b-a67e-17f959371a77	\N	none	\N	\N	539158
\.


--
-- Data for Name: ledger_entry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ledger_entry (id, vendor_name, expense_description, wbs_category, wbs_subcategory, baseline_date, baseline_amount, planned_date, planned_amount, actual_date, actual_amount, notes, "programId", invoice_link_text, invoice_link_url, "wbsElementId") FROM stdin;
9e3f3ff3-c8b1-4ef8-a908-0c47599c9bf7	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-05-01	12500	2025-05-01	12500	2025-05-02	8510	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3			\N
663123de-bf32-4a4a-b041-743b6c9cbce0	21749 Celerity Embedded Design Service, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-07-01	60000	2025-07-01	60000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
87ee3e1b-c761-4aed-bf61-19e5e3e14804	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-06-03	14707.5	2024-06-03	14707.5	2024-06-03	14707.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
add40e0d-a15e-49af-a687-375cf1eca335	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-06-17	14615	2024-06-17	14615	2024-06-17	14615	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
c698c0ba-5a1c-4523-badc-c4c3045faa24	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-07-01	9897.5	2024-07-01	9897.5	2024-07-01	9897.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
9168dc8d-3ea2-4d9e-ba0e-fc6a189af4d9	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-07-16	13320	2024-07-16	13320	2024-07-16	13320	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
853ef7e4-82ad-45ba-a2c4-d6bc83359857	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-08-01	12395	2024-08-01	12395	2024-08-01	12395	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
70269414-e723-4972-bddc-258dbfbe0cc1	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-09-04	7122.5	2024-09-04	7122.5	2024-09-04	7122.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
3536f33d-39e5-4926-adb5-c91322bf72b5	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-09-16	6660	2024-09-16	6660	2024-09-16	6660	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
c1584a55-817f-4c56-aa53-7ebaf8124113	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-10-02	7307.5	2024-10-02	7307.5	2024-10-02	7307.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
aafd35e4-f177-47d5-a86e-ef3d90785359	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-10-17	6105	2024-10-17	6105	2024-10-17	6105	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
3e671410-d8f2-44ee-81e9-4a2ce813190a	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-11-04	6706.25	2024-11-04	6706.25	2024-11-04	6706.25	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
d2b2e2bd-3eaf-4e89-ab6c-f9d645535db9	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-11-18	6197.5	2024-11-18	6197.5	2024-11-18	6197.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
e8a9c382-edfc-4245-a082-44732baa3413	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-12-04	4810	2024-12-04	4810	2024-12-04	4810	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
6b521e68-b191-490c-bd04-20f6b923572d	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-12-16	7492.5	2024-12-16	7492.5	2024-12-16	7492.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
71f69379-0537-49a5-8a41-64bc9ef98bb1	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-12-30	6567.5	2024-12-30	6567.5	2024-12-30	6567.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
9d0491a1-0190-44f8-a6cd-e79cf2a6278b	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-02-01	12500	2025-03-01	12500	2025-03-04	9065	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
627b2814-19e6-4ed6-8595-a9ece4c289d7	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-02-01	12500	2025-03-01	12500	2025-03-04	9690	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
dcced923-f0a8-4496-a865-13cd2091273a	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-03-01	12500	2025-03-01	12500	2025-03-17	1295	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
2b15ecdc-69a2-4ff4-9d95-3e07b7822e21	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-03-01	2000	2025-03-01	2000	2025-03-18	1710	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
106cf73b-f9dc-4126-8dec-2f2ad387883a	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-03-01	9500	2025-03-01	9500	2025-03-18	6650	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
86e615a0-d817-4549-a7e4-21a25fbb501b	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-03-01	12500	2025-04-01	12500	2025-04-01	9805	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
623fd94c-34fa-4871-b2be-59377847d09d	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-04-01	12500	2025-04-01	12500	2025-04-16	5735	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
b6a531a3-0d09-4b80-b8f4-5401568cfc4c	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-04-01	9500	2025-04-01	9500	2025-04-01	2850	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
ac31c4a1-0958-44dc-90d5-8d8ad6b14a31	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-06-01	12500	2025-06-01	12500	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
24a48c12-140b-4cad-8b7a-0abb98073a5b	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-06-01	9500	2025-06-01	9500	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
45f51e49-2839-468e-8c3b-dbc023057ac9	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-07-01	12500	2025-07-01	12500	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
b43c7c9d-c8b9-40be-a178-0cbf55231c9f	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-07-01	12500	2025-07-01	12500	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
9c9c1b7b-59b3-45d3-9c2c-134111cc6f58	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-08-01	12500	2025-08-01	12500	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
3a5e71d3-5d92-4b5a-8ca1-34ace975179f	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-08-01	12500	2025-08-01	12500	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
579019a4-2527-4275-be11-3d847c650f5f	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-01-17	9065	2025-01-17	9065	2025-01-17	9065	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
16178618-fc11-4817-9a80-71427f205ec9	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-06-01	12500	2025-06-01	12500	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
0b958157-26f8-4b5c-961e-9b2ecd79d61d	20921 Digi-Key Electronics, Inc. (US)	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-08-01	150000	2025-08-01	160000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
63b920e8-026b-4476-be51-3fce99e398b2	20929 Radiation Test Solutions Inc	002: Consulting	1003: Other Direct Costs	002: Consulting	2025-07-01	15000	2025-07-01	15000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
bf9abb03-5a45-49fc-9e82-d12997c4751f	21153 Summit Interconnect	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-04-01	50000	2025-05-01	50000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
4565e7d1-9e3f-4c52-b356-063782776fcb	21153 Summit Interconnect	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-09-01	50000	2025-09-01	50000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
d0f092bd-3e1e-4073-b452-ff293593b80a	21153 Summit Interconnect	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-09-01	40000	2025-10-01	40000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
6c0936c1-6dcd-492a-9bb1-253f7d40cb2b	21153 Summit Interconnect	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-09-01	10000	2025-11-01	10000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
6ee883e0-eeed-4357-845b-47ee6a1f24df	21102 J&J Machine Company, Inc.	001: Hardware	1002: Direct Material Cost	001: Hardware	2025-09-01	15000	2025-10-01	15000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
24511b6b-8d21-4a02-a1de-190d202bf800	21320 Texas Instruments	001: Hardware	1002: Direct Material Cost	001: Hardware	2023-10-06	5998	2023-10-06	5998	2023-10-06	5998	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
96f6165d-fdfd-4b36-8e8b-107355d67d53	21844 HiTech Global	001: Hardware	1002: Direct Material Cost	001: Hardware	2023-10-09	19780	2023-10-09	19780	2023-10-09	19780	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
16687958-049d-40b9-a8b8-6c0697832188	21320 Texas Instruments	001: Hardware	1002: Direct Material Cost	001: Hardware	2023-10-30	4360	2023-10-30	4360	2023-10-30	4360	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
107b3bb1-fd82-44ff-89b4-18a359d62823	21669 Polygon Design, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-09-01	20000	2025-09-01	20000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
38554505-2714-49ef-9ca1-9260fbfff197	21320 Texas Instruments	001: Hardware	1002: Direct Material Cost	001: Hardware	2024-04-04	16966.62	2024-04-04	16966.62	2024-04-04	16966.62	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
ffb0e3c3-f119-4780-86aa-70eb8a08329f	22482 E3 Designers, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-07-01	40000	2025-08-01	40000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
a67148a6-aa9d-4d35-aae3-4f1f7dd9e225	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-08-07	5365	2024-08-07	5365	2024-08-07	5365	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
23597abb-a495-497d-8f01-959b6ce58974	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2024-08-16	8140	2024-08-16	8140	2024-08-16	8140	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
38066366-3924-49a7-884c-d4c032966c12	22482 E3 Designers, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-07-01	20000	2025-09-01	20000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
ddddf982-01b3-47f7-a637-f7753ea6cf88	22482 E3 Designers, LLC	003: Hardware Design	1001: Direct Labor Cost	003: Hardware Design	2025-08-01	10000	2025-08-01	10000	\N	\N	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
325987d0-9f0b-43a5-8899-c8c7236dfcfd	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-02-04	10175	2025-02-04	10175	2025-02-04	10175	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
969709b6-eee8-463b-926d-b10dfc7caa34	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-02-17	12857.5	2025-02-17	12857.5	2025-02-17	12857.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
e190d1d3-c983-4e67-9fb9-438e45328b93	20920 Mouser Electronics	002: Test Equipment	1002: Direct Material Cost	002: Test Equipment	2025-03-01	\N	2025-03-01	\N	2025-03-21	2614.92	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
d5d8c151-92d5-4dcc-b57d-6926fac3dacd	22687 Innovative Sensing Solutions LLC	002: Consulting	1003: Other Direct Costs	002: Consulting	2025-04-01	\N	2025-04-01	\N	2025-04-01	4575	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	\N	\N	\N
795c956c-2073-483d-9d4d-b88dba8b4d15	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-05-01	9500	2025-05-01	9500	2025-05-16	9250	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	INV-3907	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=521784	\N
c6b2743f-14e8-47fa-92de-042fc4ee0794	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-04-01	12500	2025-05-01	12500	2025-05-06	5642.5	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	INV-3893	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=518227	\N
65ffd8c0-808e-4ed2-9eac-3d9126261490	21880 DesignLinx Hardware Solutions, Inc.	001: Firmware	1001: Direct Labor Cost	001: Firmware	2025-05-01	12500	2025-05-01	12500	2025-05-16	11685	\N	3702c88b-8169-4422-8e3e-17765b6dd1b3	INV-3906	https://5578993.app.netsuite.com/app/accounting/transactions/transaction.nl?id=521783	\N
\.


--
-- Data for Name: potential_match; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.potential_match (id, confidence, status, reasons, "createdAt", "updatedAt", "transactionId", "ledgerEntryId") FROM stdin;
66076888-e370-4f02-b83d-3367eb28a003	0.8	potential	["Exact vendor name match"]	2025-07-18 02:43:02.33881	2025-07-18 02:43:02.33881	c6d041b6-ba99-4a01-9fe0-d8d18e09435f	ac31c4a1-0958-44dc-90d5-8d8ad6b14a31
5d3f9bfa-a103-4d80-bfb5-d7b4b50c0a98	0.8	potential	["Exact vendor name match"]	2025-07-18 02:51:28.45172	2025-07-18 02:51:28.45172	d7f36590-12bb-4991-be0c-9b74efe9210a	16178618-fc11-4817-9a80-71427f205ec9
f4986529-c600-4cbb-ba25-d872c27d643e	0.8	potential	["Exact vendor name match"]	2025-07-08 03:20:14.126205	2025-07-08 03:20:14.126205	c6d041b6-ba99-4a01-9fe0-d8d18e09435f	24a48c12-140b-4cad-8b7a-0abb98073a5b
8e06783a-7ea9-4854-a98e-5e5276116b3c	0.8	potential	["Exact vendor name match"]	2025-07-08 03:20:14.178399	2025-07-08 03:20:14.178399	ef2b2c89-527a-46fb-aedb-20760101503a	24a48c12-140b-4cad-8b7a-0abb98073a5b
a34063c8-2ddb-44ad-8914-aa1a0eeec4be	0.8014851485148514	potential	["Exact vendor name match"]	2025-07-08 03:20:14.192897	2025-07-08 03:20:14.192897	6c07c831-7424-40ed-8f7d-3f27bfa40fea	24a48c12-140b-4cad-8b7a-0abb98073a5b
\.


--
-- Data for Name: program; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.program (id, code, name, description, status, "startDate", "endDate", "totalBudget", type, program_manager) FROM stdin;
3702c88b-8169-4422-8e3e-17765b6dd1b3	CDP.5103	NASA SBIR	ARENA 542	Active	2023-01-01 00:00:00	2026-07-31 00:00:00	749772.00	Period of Performance	Jack Dallimore
\.


--
-- Data for Name: rejected_match; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rejected_match (id, "createdAt", "transactionId", "ledgerEntryId") FROM stdin;
d96e9b69-ea0f-4ece-8e85-43ce23be0ba1	2025-07-08 03:47:19.766348	d7f36590-12bb-4991-be0c-9b74efe9210a	ac31c4a1-0958-44dc-90d5-8d8ad6b14a31
8699b66c-d434-4347-b01b-c2ae9c12ea8b	2025-07-08 03:47:20.113102	d7f36590-12bb-4991-be0c-9b74efe9210a	24a48c12-140b-4cad-8b7a-0abb98073a5b
e517e587-7f88-40a9-a7e8-6d794edb751d	2025-07-18 01:47:19.492252	c6d041b6-ba99-4a01-9fe0-d8d18e09435f	16178618-fc11-4817-9a80-71427f205ec9
98a49a25-f0ef-467b-8faf-71ed4dbfacee	2025-07-18 01:47:20.240169	ef2b2c89-527a-46fb-aedb-20760101503a	16178618-fc11-4817-9a80-71427f205ec9
8b347312-edcd-408a-bd87-00fd87b30195	2025-07-18 01:47:21.560309	6c07c831-7424-40ed-8f7d-3f27bfa40fea	16178618-fc11-4817-9a80-71427f205ec9
ca5d34f8-dbf4-4360-9f2c-db6f19b5e39d	2025-07-18 02:42:57.143609	6c07c831-7424-40ed-8f7d-3f27bfa40fea	ac31c4a1-0958-44dc-90d5-8d8ad6b14a31
3491d0dc-af5d-467b-8e07-97e20c207dcc	2025-07-18 02:42:57.964704	ef2b2c89-527a-46fb-aedb-20760101503a	ac31c4a1-0958-44dc-90d5-8d8ad6b14a31
\.


--
-- Data for Name: wbs_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wbs_category (id, name, "programId") FROM stdin;
\.


--
-- Data for Name: wbs_element; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wbs_element (id, code, name, description, level, "parentId", "createdAt", "updatedAt", "programId") FROM stdin;
ae4259a3-23b8-4e5c-992c-c04f63f74c34	1.0	Project Management	Project management and oversight activities	1	\N	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
ad16a20c-1df4-4ccc-be75-858dd0706825	1.1	Planning	Project planning and scheduling	2	ae4259a3-23b8-4e5c-992c-c04f63f74c34	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
a6a9718c-2c26-40be-b2b7-f0e21c003408	1.2	Monitoring & Control	Project monitoring and control activities	2	ae4259a3-23b8-4e5c-992c-c04f63f74c34	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
6d1172e6-ab2e-4c8d-9a93-d41f05070794	2.0	Technical Development	Technical development activities	1	\N	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
60334bc5-bdf8-45c6-9122-3890e964acc8	2.1	Design	System and component design	2	6d1172e6-ab2e-4c8d-9a93-d41f05070794	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
f1a1a1b1-bcca-40d1-8fd0-8e54b527f562	2.2	Implementation	System implementation and coding	2	6d1172e6-ab2e-4c8d-9a93-d41f05070794	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
663aee52-d7cc-49c2-8b86-f0e1f80226f2	2.3	Testing	System testing and validation	2	6d1172e6-ab2e-4c8d-9a93-d41f05070794	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
1b613f5b-ad45-4b48-849e-964edaf36dac	3.0	Integration & Deployment	System integration and deployment activities	1	\N	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
03a4f3b8-7cf8-4d95-9c24-902f378a9281	3.1	Integration	System integration activities	2	1b613f5b-ad45-4b48-849e-964edaf36dac	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
ec525386-d23c-4f0a-8629-cd1b75ccf16d	3.2	Deployment	System deployment and delivery	2	1b613f5b-ad45-4b48-849e-964edaf36dac	2025-07-18 05:34:54.228758	2025-07-18 05:34:54.228758	3702c88b-8169-4422-8e3e-17765b6dd1b3
75586540-edfb-4b1d-9735-4e3528dd85fc	4.0	Test	Describe	1	\N	2025-07-18 05:38:13.853073	2025-07-18 05:38:13.853073	3702c88b-8169-4422-8e3e-17765b6dd1b3
de3e0309-9e6d-4f9f-abe8-5719ef49f0bd	4.1	Test 1	rd	2	75586540-edfb-4b1d-9735-4e3528dd85fc	2025-07-18 05:38:24.123688	2025-07-18 05:38:24.123688	3702c88b-8169-4422-8e3e-17765b6dd1b3
48d2b782-83c1-4d95-89cd-5a2c3edbab81	1.0	Project Management	Project management and oversight activities	1	\N	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
4e2a7919-9735-4288-94c5-7687c9d4662b	1.1	Planning	Project planning and scheduling	2	48d2b782-83c1-4d95-89cd-5a2c3edbab81	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
4777ec2d-8e2b-4b65-a443-ffe3d5f0ad59	1.2	Monitoring & Control	Project monitoring and control activities	2	48d2b782-83c1-4d95-89cd-5a2c3edbab81	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
70b77640-7951-4408-9b34-848b141201af	2.0	Technical Development	Technical development activities	1	\N	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
91dbdb1c-37d9-4616-a517-c9fba9bd6f39	2.1	Design	System and component design	2	70b77640-7951-4408-9b34-848b141201af	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
cf766308-a9b2-4bc7-adce-fbea274ef8ec	2.2	Implementation	System implementation and coding	2	70b77640-7951-4408-9b34-848b141201af	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
91981a75-744b-47c8-85bc-4d035fd8bc4a	2.3	Testing	System testing and validation	2	70b77640-7951-4408-9b34-848b141201af	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
e6c0b752-797d-4992-841e-830c136fb050	3.0	Integration & Deployment	System integration and deployment activities	1	\N	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
9c34b543-9798-4aff-af1b-fab87c4c8988	3.1	Integration	System integration activities	2	e6c0b752-797d-4992-841e-830c136fb050	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
9f27cce8-b38d-473c-88d7-5d4f9ef52ef1	3.2	Deployment	System deployment and delivery	2	e6c0b752-797d-4992-841e-830c136fb050	2025-07-18 05:42:58.81782	2025-07-18 05:42:58.81782	3702c88b-8169-4422-8e3e-17765b6dd1b3
\.


--
-- Data for Name: wbs_subcategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wbs_subcategory (id, name, "categoryId") FROM stdin;
\.


--
-- Data for Name: wbs_template; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wbs_template (id, name, description, "isDefault", "createdAt", "updatedAt") FROM stdin;
870d2127-bd78-4907-9acd-f5538b0f1718	Standard Project WBS	A standard work breakdown structure for typical projects	t	2025-07-18 05:01:08.798005	2025-07-18 05:01:08.798005
\.


--
-- Data for Name: wbs_template_element; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wbs_template_element (id, code, name, description, level, "parentId", "templateId") FROM stdin;
0439968b-78e2-45db-b88e-099a71effda0	1.0	Project Management	Project management and oversight activities	1	\N	870d2127-bd78-4907-9acd-f5538b0f1718
04820570-34b8-4df7-930c-0fe4f582dbe7	1.1	Planning	Project planning and scheduling	2	0439968b-78e2-45db-b88e-099a71effda0	870d2127-bd78-4907-9acd-f5538b0f1718
9807d384-d4a6-45c1-8183-43d709c3511f	1.2	Monitoring & Control	Project monitoring and control activities	2	0439968b-78e2-45db-b88e-099a71effda0	870d2127-bd78-4907-9acd-f5538b0f1718
22b83b23-185b-458f-89ef-c5a0538092ed	2.0	Technical Development	Technical development and implementation	1	\N	870d2127-bd78-4907-9acd-f5538b0f1718
bab537f8-6740-46cb-8a6a-9d9ee67f46e1	2.1	Design	System design and architecture	2	22b83b23-185b-458f-89ef-c5a0538092ed	870d2127-bd78-4907-9acd-f5538b0f1718
4dd0da65-1ecc-41d1-90d9-c64844bb81b5	2.2	Implementation	System implementation and coding	2	22b83b23-185b-458f-89ef-c5a0538092ed	870d2127-bd78-4907-9acd-f5538b0f1718
39147e5a-2e35-4f28-8d0a-fe0063d44a62	2.3	Testing	System testing and validation	2	22b83b23-185b-458f-89ef-c5a0538092ed	870d2127-bd78-4907-9acd-f5538b0f1718
81e8ba33-210a-487a-a401-2e4e49eb86d0	3.0	Integration & Deployment	System integration and deployment activities	1	\N	870d2127-bd78-4907-9acd-f5538b0f1718
be2f1e59-b089-4bab-bab3-c0c8c5d315af	3.1	Integration	System integration activities	2	81e8ba33-210a-487a-a401-2e4e49eb86d0	870d2127-bd78-4907-9acd-f5538b0f1718
0a67d9a1-28ab-4c96-8395-27bb5f713ad4	3.2	Deployment	System deployment and go-live	2	81e8ba33-210a-487a-a401-2e4e49eb86d0	870d2127-bd78-4907-9acd-f5538b0f1718
\.


--
-- Name: ledger_entry PK_04e9d274911f909a5848a15cd74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entry
    ADD CONSTRAINT "PK_04e9d274911f909a5848a15cd74" PRIMARY KEY (id);


--
-- Name: wbs_element PK_36a346741d6f6cc98132f9a280e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_element
    ADD CONSTRAINT "PK_36a346741d6f6cc98132f9a280e" PRIMARY KEY (id);


--
-- Name: program PK_3bade5945afbafefdd26a3a29fb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program
    ADD CONSTRAINT "PK_3bade5945afbafefdd26a3a29fb" PRIMARY KEY (id);


--
-- Name: wbs_template PK_3d1c387b27ddc51ca8dcfcb4b09; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_template
    ADD CONSTRAINT "PK_3d1c387b27ddc51ca8dcfcb4b09" PRIMARY KEY (id);


--
-- Name: wbs_category PK_5df28f7dc4baaa36d9db6cca9da; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_category
    ADD CONSTRAINT "PK_5df28f7dc4baaa36d9db6cca9da" PRIMARY KEY (id);


--
-- Name: import_config PK_8bd8ff65915505dda3b5fdd1e80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_config
    ADD CONSTRAINT "PK_8bd8ff65915505dda3b5fdd1e80" PRIMARY KEY (id);


--
-- Name: potential_match PK_9a6372235480492199886fbf872; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_match
    ADD CONSTRAINT "PK_9a6372235480492199886fbf872" PRIMARY KEY (id);


--
-- Name: import_transaction PK_a098fa89d1c0063fca69f9c1e15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_transaction
    ADD CONSTRAINT "PK_a098fa89d1c0063fca69f9c1e15" PRIMARY KEY (id);


--
-- Name: wbs_template_element PK_a88da12d4c555a1967cdf6e0059; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_template_element
    ADD CONSTRAINT "PK_a88da12d4c555a1967cdf6e0059" PRIMARY KEY (id);


--
-- Name: wbs_subcategory PK_c7bf1ad522eb3b7ee0735044eeb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_subcategory
    ADD CONSTRAINT "PK_c7bf1ad522eb3b7ee0735044eeb" PRIMARY KEY (id);


--
-- Name: rejected_match PK_f22eb1cf0991e80fee29033964f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rejected_match
    ADD CONSTRAINT "PK_f22eb1cf0991e80fee29033964f" PRIMARY KEY (id);


--
-- Name: import_session PK_f4b8098c2d0c74ae24f827a97e8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_session
    ADD CONSTRAINT "PK_f4b8098c2d0c74ae24f827a97e8" PRIMARY KEY (id);


--
-- Name: program UQ_c6b8c4c1adba14ec96387d3c002; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program
    ADD CONSTRAINT "UQ_c6b8c4c1adba14ec96387d3c002" UNIQUE (code);


--
-- Name: IDX_bb78d46e6750fdfd0caacc1f4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_bb78d46e6750fdfd0caacc1f4b" ON public.potential_match USING btree ("transactionId", "ledgerEntryId");


--
-- Name: wbs_element trigger_update_wbs_element_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_wbs_element_updated_at BEFORE UPDATE ON public.wbs_element FOR EACH ROW EXECUTE FUNCTION public.update_wbs_element_updated_at();


--
-- Name: rejected_match FK_03f8a63975b1c3f5f1d3c51e557; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rejected_match
    ADD CONSTRAINT "FK_03f8a63975b1c3f5f1d3c51e557" FOREIGN KEY ("transactionId") REFERENCES public.import_transaction(id) ON DELETE CASCADE;


--
-- Name: import_config FK_055a88f0a75d869b3366296e110; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_config
    ADD CONSTRAINT "FK_055a88f0a75d869b3366296e110" FOREIGN KEY ("programId") REFERENCES public.program(id) ON DELETE CASCADE;


--
-- Name: wbs_subcategory FK_1962bb25485545daadf8423c4a6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_subcategory
    ADD CONSTRAINT "FK_1962bb25485545daadf8423c4a6" FOREIGN KEY ("categoryId") REFERENCES public.wbs_category(id) ON DELETE CASCADE;


--
-- Name: import_session FK_2ab20ecc064bed8e15247591917; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_session
    ADD CONSTRAINT "FK_2ab20ecc064bed8e15247591917" FOREIGN KEY ("programId") REFERENCES public.program(id) ON DELETE CASCADE;


--
-- Name: wbs_element FK_31ddf986038af9d53ec700aae83; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_element
    ADD CONSTRAINT "FK_31ddf986038af9d53ec700aae83" FOREIGN KEY ("parentId") REFERENCES public.wbs_element(id);


--
-- Name: wbs_template_element FK_326eca9eb86b24f64b172877a7f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_template_element
    ADD CONSTRAINT "FK_326eca9eb86b24f64b172877a7f" FOREIGN KEY ("parentId") REFERENCES public.wbs_template_element(id);


--
-- Name: import_transaction FK_6c179b80e5944aedc565b456d65; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_transaction
    ADD CONSTRAINT "FK_6c179b80e5944aedc565b456d65" FOREIGN KEY ("importSessionId") REFERENCES public.import_session(id) ON DELETE CASCADE;


--
-- Name: rejected_match FK_8475e9d63a822ed461194f0111f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rejected_match
    ADD CONSTRAINT "FK_8475e9d63a822ed461194f0111f" FOREIGN KEY ("ledgerEntryId") REFERENCES public.ledger_entry(id) ON DELETE CASCADE;


--
-- Name: wbs_template_element FK_a98f2a211c29bce2ffa5486f2dc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_template_element
    ADD CONSTRAINT "FK_a98f2a211c29bce2ffa5486f2dc" FOREIGN KEY ("templateId") REFERENCES public.wbs_template(id) ON DELETE CASCADE;


--
-- Name: wbs_element FK_bcbb8f6afc6176d6fbafa817624; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wbs_element
    ADD CONSTRAINT "FK_bcbb8f6afc6176d6fbafa817624" FOREIGN KEY ("programId") REFERENCES public.program(id) ON DELETE CASCADE;


--
-- Name: potential_match FK_c111e56c6e7aff159b95cce1592; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_match
    ADD CONSTRAINT "FK_c111e56c6e7aff159b95cce1592" FOREIGN KEY ("transactionId") REFERENCES public.import_transaction(id) ON DELETE CASCADE;


--
-- Name: potential_match FK_c602f5d0477b638e477fdf47320; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.potential_match
    ADD CONSTRAINT "FK_c602f5d0477b638e477fdf47320" FOREIGN KEY ("ledgerEntryId") REFERENCES public.ledger_entry(id) ON DELETE CASCADE;


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
-- Name: import_transaction FK_edd96faadd70ef82d32b97b0d44; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_transaction
    ADD CONSTRAINT "FK_edd96faadd70ef82d32b97b0d44" FOREIGN KEY ("matchedLedgerEntryId") REFERENCES public.ledger_entry(id);


--
-- Name: ledger_entry FK_fc435d921159a67df4193f79da3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entry
    ADD CONSTRAINT "FK_fc435d921159a67df4193f79da3" FOREIGN KEY ("wbsElementId") REFERENCES public.wbs_element(id);


--
-- PostgreSQL database dump complete
--

