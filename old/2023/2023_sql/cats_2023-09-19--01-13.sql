--
-- PostgreSQL database dump
--

-- Dumped from database version 15.2
-- Dumped by pg_dump version 15.3

-- Started on 2023-09-19 01:15:58

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 24673)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    parent_id integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 24676)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 3451 (class 0 OID 0)
-- Dependencies: 218
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 3298 (class 2604 OID 24755)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 3444 (class 0 OID 24673)
-- Dependencies: 217
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, parent_id, name) FROM stdin;
1	\N	Business Consulting and Management
2	\N	Consumer Services and Retail
3	\N	Legal Services and Law
4	\N	Financial Services and Banking
5	\N	Healthcare Services and Medical Care
6	\N	Information Technology Services and Software
7	\N	Transportation Services and Logistics
8	1	Consulting and Strategy
9	1	Marketing and Sales
10	1	Human Resources and Talent
11	2	Personal Services and Care
12	2	Retail and Shopping
13	2	Hospitality and Entertainment
14	3	Corporate Law and Business
15	3	Intellectual Property Law and Patents
16	3	Criminal Law and Justice
17	3	Family Law and Divorce
18	3	Immigration Law and Visas
19	4	Banking Services and Loans
20	4	Investment Services and Wealth Management
21	4	Insurance Services and Coverage
22	4	Accounting and Tax Services
23	5	Medical Services and Procedures
24	5	Dental Services and Care
25	5	Mental Health Services and Counseling
26	6	Software Development and Programming
27	6	Hardware Services and Repairs
28	6	Telecom Services and Networks
29	26	Mobile App Development and Design
30	26	Web Development and Design
31	26	Artificial Intelligence and Machine Learning
32	26	Database Management and Analytics
33	26	Cloud Services and Infrastructure
34	26	Cybersecurity and Network Protection
35	8	IT Strategy Consulting
36	8	Operations Strategy Consulting
37	8	Organizational Strategy Consulting
38	8	Business Model Consulting
39	8	Market Entry Strategy Consulting
40	8	Pricing and Revenue Management Consulting
41	9	Digital Marketing Services
42	9	Brand Management Services
43	9	Social Media Marketing Services
44	9	Advertising and Promotion Services
45	9	Sales Training and Coaching Services
46	9	Lead Generation and CRM Services
47	10	Talent Acquisition Services
48	10	Employee Benefits and Compensation Services
49	10	HR Compliance and Policy Services
50	10	Performance Management Services
51	10	HR Technology and Systems Services
52	10	Employee Relations and Labor Services
53	11	Beauty and Wellness Services
54	11	Home Services and Repair
55	11	Senior Care Services
56	11	Childcare and Nanny Services
57	11	Pet Services and Care
58	11	Errand and Concierge Services
59	12	Fashion and Apparel Retail
60	12	Home Goods and Furniture Retail
61	12	Food and Grocery Retail
62	12	Electronics and Technology Retail
63	12	Sporting Goods and Fitness Retail
64	12	Automotive Retail
65	13	Restaurants and Bars
66	13	Hotels and Accommodations
67	13	Event Planning and Services
68	13	Travel and Tourism Services
69	13	Arts and Culture Services
70	13	Recreational and Leisure Services
71	14	Mergers and Acquisitions Law
72	14	Contract Law and Negotiation
73	14	Bankruptcy and Restructuring Law
74	14	Employment and Labor Law
75	14	Regulatory Compliance Law
76	14	Corporate Governance and Ethics Law
77	16	Criminal Defense Law
78	16	White Collar Crime Law
79	16	Drug Crime Law
80	16	Sex Crime Law
81	16	DUI and Traffic Law
82	16	Juvenile Justice Law
83	17	Divorce and Separation Law
84	17	Child Custody and Support Law
85	17	Adoption and Foster Care Law
86	17	Prenuptial and Postnuptial Agreements
87	17	Domestic Violence Law
88	17	Estate Planning and Probate Law
89	18	Business and Investment Immigration Law
90	18	Family-Based Immigration Law
91	18	Employment-Based Immigration Law
92	18	Asylum and Refugee Law
93	18	Deportation Defense Law
94	18	Citizenship and Naturalization Law
95	19	Personal Banking Services
96	19	Business Banking Services
97	19	Credit Cards and Payment Processing
98	19	Mortgages and Home Equity Loans
99	19	Auto Loans and Financing
100	19	Student Loans and Financing
101	20	Financial Planning and Advice
102	20	Retirement Planning and Services
103	20	Wealth Management and Investment Advisory
104	20	Estate Planning and Trust Services
105	20	Tax Planning and Preparation
106	20	Philanthropic Planning and Services
107	21	Personal Insurance and Coverage
108	21	Business Insurance and Coverage
109	21	Life Insurance and Coverage
110	21	Health Insurance and Coverage
111	21	Auto Insurance and Coverage
112	21	Property and Casualty Insurance
113	22	Tax Preparation and Planning
114	22	Bookkeeping and Payroll Services
115	22	Financial Reporting and Statements
116	22	Audit and Assurance Services
117	22	Budgeting and Forecasting Services
118	22	Outsourced CFO and Controller Services
119	23	Diagnostic Services and Imaging
120	23	Surgical Services and Procedures
121	23	Emergency Services and Urgent Care
122	23	Rehabilitation Services and Therapy
123	24	Preventive Dentistry and Cleanings
124	24	Restorative Dentistry and Fillings
125	24	Orthodontic Services and Braces
126	24	Oral Surgery and Extractions
127	25	Individual Counseling and Therapy
128	25	Couples and Family Counseling
129	25	Psychiatric Services and Medication Management
130	25	Addiction and Substance Abuse Counseling
131	27	Computer Repair and Maintenance
132	27	Printer and Scanner Repair
133	27	Network Equipment Repair and Configuration
134	27	Data Recovery and Backup Services
135	28	Internet Services and Connectivity
136	28	Phone Services and Systems
137	28	Video Conferencing and Collaboration
138	28	Telecom Consulting and Optimization
201	15	Trademark and Copyright Law
202	15	Patent Prosecution and Litigation
203	15	Trade Secret Law and Protection
204	15	Licensing and Royalties
205	204	Test cat
\.


--
-- TOC entry 3452 (class 0 OID 0)
-- Dependencies: 218
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- TOC entry 3300 (class 2606 OID 24770)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3301 (class 2606 OID 24805)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


-- Completed on 2023-09-19 01:15:58

--
-- PostgreSQL database dump complete
--

