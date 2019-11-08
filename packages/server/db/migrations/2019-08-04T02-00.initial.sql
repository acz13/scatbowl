--initial (up)



CREATE SCHEMA question_db;

ALTER SCHEMA question_db OWNER TO postgres;

COMMENT ON SCHEMA question_db IS 'schema and data initially imported from quizdb';

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA question_db;


COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: bonus_parts; Type: TABLE; Schema: question_db; Owner: scatbowl
--

CREATE TABLE question_db.bonus_parts (
    id integer NOT NULL,
    bonus_id integer,
    text text,
    answer text,
    formatted_text text,
    formatted_answer text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    number integer NOT NULL,
    wikipedia_url text,

    FOREIGN KEY (bonus_id) REFERENCES bonuses (id)
);


ALTER TABLE question_db.bonus_parts OWNER TO scatbowl;

--
-- Name: bonus_parts_id_seq; Type: SEQUENCE; Schema: question_db; Owner: scatbowl
--

CREATE SEQUENCE question_db.bonus_parts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_db.bonus_parts_id_seq OWNER TO scatbowl;

--
-- Name: bonus_parts_id_seq; Type: SEQUENCE OWNED BY; Schema: question_db; Owner: scatbowl
--

ALTER SEQUENCE question_db.bonus_parts_id_seq OWNED BY question_db.bonus_parts.id;


--
-- Name: bonuses; Type: TABLE; Schema: question_db; Owner: scatbowl
--

CREATE TABLE question_db.bonuses (
    id integer NOT NULL,
    number integer,
    round character varying,
    category_id integer,
    subcategory_id integer,
    quinterest_id integer,
    tournament_id integer,
    leadin text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    errors_count integer DEFAULT 0,
    formatted_leadin text,

    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories (id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
);


ALTER TABLE question_db.bonuses OWNER TO scatbowl;

--
-- Name: bonuses_id_seq; Type: SEQUENCE; Schema: question_db; Owner: scatbowl
--

CREATE SEQUENCE question_db.bonuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_db.bonuses_id_seq OWNER TO scatbowl;

--
-- Name: bonuses_id_seq; Type: SEQUENCE OWNED BY; Schema: question_db; Owner: scatbowl
--

ALTER SEQUENCE question_db.bonuses_id_seq OWNED BY question_db.bonuses.id;


--
-- Name: categories; Type: TABLE; Schema: question_db; Owner: scatbowl
--

CREATE TABLE question_db.categories (
    id integer NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE question_db.categories OWNER TO scatbowl;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: question_db; Owner: scatbowl
--

CREATE SEQUENCE question_db.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_db.categories_id_seq OWNER TO scatbowl;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: question_db; Owner: scatbowl
--

ALTER SEQUENCE question_db.categories_id_seq OWNED BY question_db.categories.id;


--
-- Name: errors; Type: TABLE; Schema: question_db; Owner: scatbowl
--

CREATE TABLE question_db.errors (
    id integer NOT NULL,
    description text NOT NULL,
    error_type integer NOT NULL,
    resolved boolean DEFAULT false,
    errorable_type character varying,
    errorable_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE question_db.errors OWNER TO scatbowl;

--
-- Name: errors_id_seq; Type: SEQUENCE; Schema: question_db; Owner: scatbowl
--

CREATE SEQUENCE question_db.errors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_db.errors_id_seq OWNER TO scatbowl;

--
-- Name: errors_id_seq; Type: SEQUENCE OWNED BY; Schema: question_db; Owner: scatbowl
--

ALTER SEQUENCE question_db.errors_id_seq OWNED BY question_db.errors.id;


--
-- Name: subcategories; Type: TABLE; Schema: question_db; Owner: scatbowl
--

CREATE TABLE question_db.subcategories (
    id integer NOT NULL,
    name character varying,
    category_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,

    FOREIGN KEY (category_id) REFERENCES categories (id)
);


ALTER TABLE question_db.subcategories OWNER TO scatbowl;

--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: question_db; Owner: scatbowl
--

CREATE SEQUENCE question_db.subcategories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_db.subcategories_id_seq OWNER TO scatbowl;

--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: question_db; Owner: scatbowl
--

ALTER SEQUENCE question_db.subcategories_id_seq OWNED BY question_db.subcategories.id;


--
-- Name: tossups; Type: TABLE; Schema: question_db; Owner: scatbowl
--

CREATE TABLE question_db.tossups (
    id integer NOT NULL,
    text text NOT NULL,
    answer text NOT NULL,
    number integer,
    tournament_id integer,
    category_id integer,
    subcategory_id integer,
    round character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    quinterest_id integer,
    formatted_text text,
    errors_count integer DEFAULT 0,
    formatted_answer text,
    wikipedia_url text,

    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories (id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
);


ALTER TABLE question_db.tossups OWNER TO scatbowl;

--
-- Name: tossups_id_seq; Type: SEQUENCE; Schema: question_db; Owner: scatbowl
--

CREATE SEQUENCE question_db.tossups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_db.tossups_id_seq OWNER TO scatbowl;

--
-- Name: tossups_id_seq; Type: SEQUENCE OWNED BY; Schema: question_db; Owner: scatbowl
--

ALTER SEQUENCE question_db.tossups_id_seq OWNED BY question_db.tossups.id;


--
-- Name: tournaments; Type: TABLE; Schema: question_db; Owner: scatbowl
--

CREATE TABLE question_db.tournaments (
    id integer NOT NULL,
    year integer NOT NULL,
    name character varying NOT NULL,
    difficulty integer NOT NULL,
    quality integer,
    address character varying,
    type character varying,
    link character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE question_db.tournaments OWNER TO scatbowl;

--
-- Name: tournaments_id_seq; Type: SEQUENCE; Schema: question_db; Owner: scatbowl
--

CREATE SEQUENCE question_db.tournaments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_db.tournaments_id_seq OWNER TO scatbowl;

--
-- Name: tournaments_id_seq; Type: SEQUENCE OWNED BY; Schema: question_db; Owner: scatbowl
--

ALTER SEQUENCE question_db.tournaments_id_seq OWNED BY question_db.tournaments.id;


--
-- Name: bonus_parts id; Type: DEFAULT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.bonus_parts ALTER COLUMN id SET DEFAULT nextval('question_db.bonus_parts_id_seq'::regclass);


--
-- Name: bonuses id; Type: DEFAULT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.bonuses ALTER COLUMN id SET DEFAULT nextval('question_db.bonuses_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.categories ALTER COLUMN id SET DEFAULT nextval('question_db.categories_id_seq'::regclass);


--
-- Name: errors id; Type: DEFAULT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.errors ALTER COLUMN id SET DEFAULT nextval('question_db.errors_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.subcategories ALTER COLUMN id SET DEFAULT nextval('question_db.subcategories_id_seq'::regclass);


--
-- Name: tossups id; Type: DEFAULT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.tossups ALTER COLUMN id SET DEFAULT nextval('question_db.tossups_id_seq'::regclass);


--
-- Name: tournaments id; Type: DEFAULT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.tournaments ALTER COLUMN id SET DEFAULT nextval('question_db.tournaments_id_seq'::regclass);


--
-- Name: bonus_parts bonus_parts_pkey; Type: CONSTRAINT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.bonus_parts
    ADD CONSTRAINT bonus_parts_pkey PRIMARY KEY (id);


--
-- Name: bonuses bonuses_pk; Type: CONSTRAINT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.bonuses
    ADD CONSTRAINT bonuses_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pk; Type: CONSTRAINT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: errors errors_pk; Type: CONSTRAINT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.errors
    ADD CONSTRAINT errors_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_pk; Type: CONSTRAINT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: tossups tossups_pk; Type: CONSTRAINT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.tossups
    ADD CONSTRAINT tossups_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_pk; Type: CONSTRAINT; Schema: question_db; Owner: scatbowl
--

ALTER TABLE ONLY question_db.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: index_bonus_parts_on_answer_gin_trgm_ops; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_bonus_parts_on_answer_gin_trgm_ops ON question_db.bonus_parts USING gin (answer question_db.gin_trgm_ops);


--
-- Name: index_bonus_parts_on_bonus_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_bonus_parts_on_bonus_id ON question_db.bonus_parts USING btree (bonus_id);


--
-- Name: index_bonus_parts_on_text_gin_trgm_ops; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_bonus_parts_on_text_gin_trgm_ops ON question_db.bonus_parts USING gin (text question_db.gin_trgm_ops);


--
-- Name: index_bonuses_on_category_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_bonuses_on_category_id ON question_db.bonuses USING btree (category_id);


--
-- Name: index_bonuses_on_leadin_gin_trgm_ops; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_bonuses_on_leadin_gin_trgm_ops ON question_db.bonuses USING gin (leadin question_db.gin_trgm_ops);


--
-- Name: index_bonuses_on_subcategory_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_bonuses_on_subcategory_id ON question_db.bonuses USING btree (subcategory_id);


--
-- Name: index_bonuses_on_tournament_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_bonuses_on_tournament_id ON question_db.bonuses USING btree (tournament_id);


--
-- Name: index_categories_on_name; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE UNIQUE INDEX index_categories_on_name ON question_db.categories USING btree (name);


--
-- Name: index_errors_on_errorable_type_and_errorable_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_errors_on_errorable_type_and_errorable_id ON question_db.errors USING btree (errorable_type, errorable_id);


--
-- Name: index_subcategories_on_category_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_subcategories_on_category_id ON question_db.subcategories USING btree (category_id);


--
-- Name: index_subcategories_on_name; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE UNIQUE INDEX index_subcategories_on_name ON question_db.subcategories USING btree (name);


--
-- Name: index_tossups_on_answer_gin_trgm_ops; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_tossups_on_answer_gin_trgm_ops ON question_db.tossups USING gin (answer question_db.gin_trgm_ops);


--
-- Name: index_tossups_on_category_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_tossups_on_category_id ON question_db.tossups USING btree (category_id);


--
-- Name: index_tossups_on_quinterest_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE UNIQUE INDEX index_tossups_on_quinterest_id ON question_db.tossups USING btree (quinterest_id);


--
-- Name: index_tossups_on_subcategory_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_tossups_on_subcategory_id ON question_db.tossups USING btree (subcategory_id);


--
-- Name: index_tossups_on_text_gin_trgm_ops; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_tossups_on_text_gin_trgm_ops ON question_db.tossups USING gin (text question_db.gin_trgm_ops);


--
-- Name: index_tossups_on_tournament_id; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE INDEX index_tossups_on_tournament_id ON question_db.tossups USING btree (tournament_id);


--
-- Name: index_tournaments_on_name; Type: INDEX; Schema: question_db; Owner: scatbowl
--

CREATE UNIQUE INDEX index_tournaments_on_name ON question_db.tournaments USING btree (name);


--
-- PostgreSQL database dump complete
--

