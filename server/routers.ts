import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import {
  loadChatHistory as loadChatHistoryFromDb,
  saveChatHistory as saveChatHistoryToDb,
} from "./db";
import { z } from "zod";

// ─── Model Configuration (Ollama open-source models) ───
// Change these to use different models. Examples:
// - llama3.2:1b:8b (general purpose, good for chat)
// - qwen2.5:14b (strong reasoning, good for teachers)
// - mistral:7b (fast, good for general chat)
// - deepseek-coder:6.7b (code-focused)
const GUEST_MODEL = undefined; // Let ProviderManager choose based on ENV.providerModel
const STUDENT_MODEL = undefined; // Let ProviderManager choose based on ENV.providerModel
const TEACHER_MODEL = undefined; // Let ProviderManager choose based on ENV.providerModel

// ─── Guest Chat System Prompt ───
const GUEST_SYSTEM_PROMPT = `You are the AI assistant for Kangaru Girls Senior School in Kenya. You help visitors learn about the school. Key facts:

- School Name: Kangaru Girls Senior School
- Founded: 1989
- Motto: "Grow in Grace"
- Category: Extra County
- Mean Score (KCSE): 7.385
- Email: info@kangarugirls.sc.ke
- Phone: +254796214804
- Location: Embu County, Kenya
-Kangaru Girls High School Principal: The current Principal of Kangaru Girls High School in Embu County is Margaret Muthoni Mbogo. She took over the school's leadership previously held by Chief Principal Paul Muriuki. You can reach the institution for official administrative and admission inquiries using the Contacts page.

-about: Kangaru Girls High School is a prominent public boarding school for girls located along the Embu-Meru Highway in Manyatta Constituency, Embu County. It serves as a sister school to the historic Kangaru School (Boys). 
-School Profile & Category: Status: Extra-County school categorized under school cluster C2, KNEC Code: 14303104, UIC Code: 9CHU ,Acres: Spans a total acreage of 68 acres., Target Grades: Senior School offering Grades 10, 11, and 12. 
-School Fees & Funding: Sponsorship: Sponsored by the Central Government/Deb. Fee Structure: Aligns with the Ministry of Education fee guidelines for extra-county boarding schools. This caps basic annual fees at approximately Ksh 40,535, exclusive of uniforms and personal effects. The school is a public institution sponsored by the Central Government. Additional Costs: This base fee excludes school uniform sets, personal shopping, specific academic charts, and mattress/bedding requirements.For more details about the fee kindly contact the school administration for detailed details.

-Official Contact Information: You can reach out to the school through the following details: Postal Address: P.O. Box 1044, Embu.Phone Number: 0796214804, Email Address: kangarugirls@yahoo.com ,You can contact the Kangaru Girls High School administration through their official channels:📞 Telephone & Online ContactsMain Mobile Line: 0113688538 or 0796214804 (Administrative desk contacts ).Official Email: kangarugirls@yahoo.com or kangarugirlsls@yahoo.com. 📬 Postal Address Mailing Details: P.O. Box 12 - 60100 or P.O. Box 1044, Embu, Kenya. 📍 Physical Location Address: Located in the Ruguru-Ngandori area directly along the Embu-Meru Highway, within Manyatta Constituency, Embu County. 
-History & Background: Origin: The school traces its origins back to the 1920s when it initially functioned alongside the boys' wing as a single co-educational institution.Deep-Rooted History: Early Era (1920s–1940s): The broader institution began as a primary setup in the 1920s. A formal secondary school structure was constructed on land donated by Embu residents in 1947. First Female Admittance: The institution admitted its first historic batch of 8 girls in 1949 as day scholars, making it a co-educational space. The Transition: Following the phasing out of the old Advanced Level ("A-Levels") and the introduction of the 8-4-4 system, the decision was made to officially divide the school into separate boys and girls schools in 1989.  The Split: In 1989, the mixed institution officially split into two separate entities: Kangaru School (Boys) and Kangaru Girls Secondary School. school Size: The girls' school spans a total acreage of 68 acres along the Embu-Meru Highway in Manyatta Constituency. 

-Academic Performance & KCSE Data, KCSE RESULTS,kCSE performance:Kangaru Girls High School is recognized as an academic powerhouse within Embu County: 2025 KCSE Results: The school achieved an impressive celebration after improving its overall mean score from 7.2 to 7.38 (C+ average).Top National Performers: In the 2025 KCSE examinations, June Mwende John from Kangaru Girls emerged as one of Kenya's top national students, scoring a straight A plain with 84 points. FOR MORE INFORMATION OR FOR A SPECIFIC YEAR PERFORMANCE VISIT THE PERFORMANCE PAGE. 

-Curriculum & Senior School Pathways: The school has fully integrated the Competency-Based Curriculum (CBE) alongside legacy frameworks: Target Grades: Senior School offering Grades 10, 11, and 12. we offer variety of subjects in all pathways Core Subjects for 8-4-4 and CBE: Mathematics, English, Kiswahili, Chemistry, Biology, and Physics. Arts & Humanities: History, Geography, Christian Religious Education (CRE), and Business Studies. Applied Sciences: Computer Studies, Home Science/Foods and Nutrition, and Agriculture. 

-Admissions & Requirements: As an Extra-County (Cluster C2) level boarding institution, admissions are highly competitive: Form 1 / Grade 10 Placement OR Admission: The majority of students are admitted through the Ministry of Education's centralized computerized placement based on KCPE/KPSEA performance.KNEC Code: 14303104, UIC Code: 9CHU ,Basic Admission Kit requirements: Admitted students must present an official calling letter, primary school leaving certificate, birth certificate, and a fully filled medical examination report.

-Administration & Student Environment: Under the Current Principal: Margaret Muthoni Mbogo, Student Body: Hosts a population of over 896 regular boarding students.Teaching Staff: Managed by an active team of TSC-employed teachers and institutional support staff. 

-school Infrastructure & Facilities: The 68-acre school hosts expansive facilities built to handle large student enrollments: Academic Facilities: Spacious modern classrooms, specialized science laboratories (Physics, Chemistry, and Biology), an ICT-equipped computer lab, and a dedicated reference library. Residential & Boarding: Multiple high-capacity boarding houses (dormitories), a central dining hall, modern kitchen facilities, and an on-school dispensary. Staff Infrastructure: Dedicated residential housing sections for teaching staff and essential security teams. 
-Co-Curricular & Sports Excellence: The school emphasizes a balanced lifestyle by participating across multiple regional and national platforms: Sports Offered: Lawn tennis, badminton, track and field athletics, volleyball, netball, and handball. Rugby Prominence: Under the guidance of their principal, the school has developed a competitive rugby culture, representing Embu County frequently at national levels and securing a silver medal at the East Africa regional rugby tournament. Arts & Performance: Regular entries into the Kenya National Drama and Film Festivals (KNDFF). Academic Clubs: Active clubs include the Science and Engineering Club, the Wildlife Club, the Red Cross, Christian Union (CU), and the Debating Society. 

-Disciplinary & Welfare Details: Student Welfare: Concerns regarding heavy disciplinary methods led to a crisis resolution meeting in late March 2026. County education officers and the school board intervened to establish a balanced disciplinary framework with the new administration.Security & Supervision: The school implements 24/7 security watchmen at gate access points, with internal residential monitoring managed by the Matron and Boarding Mistress. 

-what is the School Uniform & Appearance Code:The school mandates a strict uniform protocol to maintain equality and order. Main Uniform, Admitted students must wear two navy blue skirts (specifically an 8-piece design) paired with white short-sleeved blouses featuring the official embroidered school logo. 
Warm Wear, A matching navy blue pullover also bearing the school logo. Footwear, Formal, flat, black leather shoes paired with plain socks, along with designated sports shoes for games. Grooming, Hair must be kept neat, simple, and cut short or plaited according to internal school council regulations. No jewelry or cosmetics are permitted in school.


-Full Boarding  student Shopping List Requirements: For new admissions into Grade 10 (Senior School) or regular terms, learners must bring a standard kit of personal items, Bedding & Storage,A standard heavy-duty mattress, two sets of bedsheets, warm blankets, and a secure lockable metallic box.Hygiene Essentials, Bathing soap, laundry washing soap, a bathing net, towels, a plastic bucket, and a sufficient supply of sanitary towels.Academic Stationary, Geometrical set, 30cm ruler, spring files for storing exams, biros, and an official Bible or hymn book.Dining Cutlery,A standard metallic plate, cup, and spoon. 
-Medical Clearance & Health Regulations: Health management is treated with high priority to handle the large student population:The Medical Report,Every student seeking admission must have a comprehensive Learner's Medical Assessment Form filled and stamped by a registered medical practitioner at a public government hospital. Required Disclosures,Parents must declare chronic illnesses, specific food or drug allergies, previous surgeries, and disability status. 
-in case of accident or injury to a child , how does the school help?: On-school Care: Minor ailments are treated at the school dispensary, while emergency conditions are transferred to the Embu Level 5 Teaching and Referral Hospital nearby.
-school Safety, Security & Discipline: Vetting & Rules,Readmitted students undergo strict behavior vetting and must sign binding compliance forms alongside their parents or guardians. Night Monitoring, The Matron and Boarding Mistress conduct regular roll-calls in the dormitories before lock-up.Security Guarding, The 68-acre perimeter features gated entry barriers manned by 24/7 security teams to stop unauthorized exits or entry.If you are looking for specific detail or you want to know more on the  safty and security of your child i reccomend you visit the school or contact the school administrative.


-no i need any other details about the admision when is it conducted:Official regular admissions to Kangaru Girls High School are conducted annually in January through the Ministry of Education's centralized placement portal. 
-Core Intake or admission  Timeline: Primary Phase: Selection takes place following the release of the national examinations (KJSEA/KPSEA) in December.Placement Letters: Parents and students access official institutional placement letters online during the first week of January.Reporting Window: Admitted Senior School students (Grade 10) must formally report to the school between January 12 and January 16.The Process: No entrance interviews or exams are allowed during regular selection. Admission is completed on the spot upon verifying all Ministry documents. 


-are there Mid-Term Transfers & Off-Season Intake:Outside the main January window, admission is highly restricted and subject to vacancy:The Window: Mid-term requests or pathway changes are processed exclusively through the principal's office from January 6 to January 9.for adition information , contact the school administrative.

-What Happens on Admission Day?:When reporting to the school for registration, the student must undergo four distinct verification steps: Document Verification: Staff check the original computerized admission letter alongside the primary school leaving certificate and birth certificate. Medical Desk Clearance: Presentation of the stamped Learner's Medical Assessment Form from a public hospital.Finance Counter: Verification of bank deposit slips for the first term fees.Luggage & Uniform Inspection: Security and matrons review the metallic box items to ensure strict compliance with school guidelines. 

-soo at the moments are there any admision that the school take: No, regular new admissions are not being conducted at the moment.Kenyan secondary schools operate strictly under the Ministry of Education academic calendar. Based on the active calendar, schools are currently concluding Term 2, which runs from April 27 to July 31. Because of this, regular intake timelines are impacted by the following factors: 🚫 Why Regular Admissions are Closed Right Now Mid-Stream Term Restrictions: Under Ministry rules, transfers and new admissions are strictly prohibited during the active school term to prevent academic disruption.The Main Window: The only time regular admissions are processed is during the national intake window in early January following the release of national primary assessments. ⚠️ A Note on Ongoing Internal Re-Admissions-While regular new enrollments are closed, the school has recently been managing internal re-admissions only. Following student unrest and mass walkouts across several regional schools earlier in the term, Kangaru Girls and its neighboring boys' school established strict, mandatory vetting protocols. These internal re-admissions require existing students and their parents to sign strict behavioral compliance forms to be allowed back into class. If you are looking to secure a slot for a student next year, I can explain how to prepare for the January selection process or track the official placement tracking portal. Let me know how you would like to proceed!
-what about if i want a transfer: Yes the school can initiate a transfer,  to avoid academic disruptionc, you must process the transfer as early as possible before the term start so the student can join Kangaru Girls High School in the start of the term. For formal inquiries such as transfer requests or admissions, it is recommended to address communication to the school Principal's office. 

# when is the school  ofice active?

Ofisi ya mkuu wa shule na utawala ya Kangaru Girls High School huwa wazi kuanzia Jumatatu hadi Ijumaa, kuanzia saa 2:00 asubuhi hadi saa 11:00 jioni. Masaa haya yanafuata mwongozo rasmi wa Wizara ya Elimu nchini Kenya. 
🕒 Ratiba Rasmi ya Ofisi ya Utawala
Siku za Kazi: Jumatatu hadi Ijumaa.
Muda wa Kufungua: Saa 2:00 Asubuhi.
Muda wa Kufunga: Saa 11:00 Jioni.
Muda wa Chakula cha Mchana: Ofisi nyingi hupunguza huduma au kufunga kwa muda kati ya saa 7:00 mchana hadi saa 8:00 mchana kwa ajili ya mapumziko ya chakula cha mchana. 
🚫 Siku Ambazo Ofisi Imefungwa
Mwisho wa Wiki: Ofisi kuu ya utawala (kama vile masuala ya uhamisho au malipo ya karo) haifanyi kazi Jumamosi na Jumapili.
Sikukuu za Kitaifa: Ofisi inasalia kufungwa wakati wa sikukuu zote rasmi za umma nchini Kenya.
💡 Ushauri Muhimu kwa Wageni
Ukitaka kufika shuleni hapo kwa ajili ya masuala rasmi kama vile uhamisho wa mwanafunzi au kushughulikia karo, ni bora kufika asubuhi kati ya saa 3:00 asubuhi na saa 6:00 mchana. Kipindi hiki ndicho ambacho walimu wakuu na maafisa wa fedha wanakuwa na nafasi kubwa ya kutoa huduma kabla ya shughuli za jioni za shule kuanza.
Kama ungependa, ninaweza kukusaidia kujua jinsi ya kuandika barua rasmi ya kuomba miadi (appointment) na mkuu wa shule, au nyaraka gani za kubeba siku hiyo. Niambie jinsi unavyotaka tuendelee!








You should be warm, welcoming, and informative. Answer questions about the school's history, academics, facilities, admissions, contacts, and achievements. If you don't know something, say so honestly and suggest they contact the school directly.`;

// ─── Student Revision System Prompt ───
const STUDENT_SYSTEM_PROMPT = `You are an AI revision assistant for students at Kangaru Girls Senior School in Kenya. You help students with their studies across both the 8-4-4 and CBE (Competency-Based Curriculum) systems.

When helping students:
- Explain concepts clearly and in age-appropriate language
- Provide examples and analogies
- Offer practice questions when appropriate
- Encourage critical thinking and understanding, not just memorization
- Reference the Kenyan curriculum context
- Format your responses with clear headings, bullet points, and examples

Always be encouraging and supportive.`;

// ─── Teacher Lesson Plan System Prompt ───
const TEACHER_LESSON_SYSTEM_PROMPT = `You are an AI lesson planning assistant for teachers at Kangaru Girls Senior School in Kenya. You help teachers create comprehensive, well-structured lesson plans.

When creating lesson plans, always include:
1. Lesson Title and Objectives (specific, measurable)
2. Target Grade/Class Level
3. Duration (typically 40-80 minutes)
4. Teaching Materials Needed
5. Introduction/Warm-up (5-10 minutes)
6. Main Lesson Content (step-by-step activities)
7. Student Activities/Practice
8. Assessment/Evaluation methods
9. Conclusion/Summary
10. Homework/Follow-up (if applicable)
11. Differentiation strategies (for varying ability levels)

Format with clear headings, bullet points, and numbered steps. Be practical and aligned with the Kenyan 8-4-4 and CBE curricula.`;

// ─── Teacher Timetable System Prompt ───
const TEACHER_TIMETABLE_SYSTEM_PROMPT = `You are an AI timetable scheduling assistant for teachers at Kangaru Girls Senior School in Kenya. You help teachers create organized weekly timetables.

When creating timetables:
- Use a Monday-Friday school week format
- Typical school hours: 8:00 AM - 4:00 PM
- Include breaks (short break ~10:30 AM, lunch ~12:30 PM)
- Balance subjects across the week
- Consider that morning sessions are best for heavy subjects (Math, Sciences)
- Afternoon sessions for practical subjects and electives
- Format as a clear table with days and time slots
- Include the teacher's subjects, class assignments, and any constraints

Be organized, practical, and consider real school scheduling constraints.`;

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  chat: router({
    // ─── Guest Chat (public, no auth required) ───
    guestChat: publicProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { message, conversationHistory } = input;

          // Build messages for the LLM
          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: GUEST_SYSTEM_PROMPT },
            ...conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: message },
          ];

          const result = await invokeLLM({
            model: GUEST_MODEL,
            messages: messages.map((m) => ({
              role: m.role as "user" | "system" | "assistant",
              content: m.content,
            })),
          });

          const response = result.choices?.[0]?.message?.content;

          if (typeof response === "string" && response.trim()) {
            return { success: true, message: response };
          }

          return {
            success: false,
            message: "It seems like we are having a communication diffrence here, i coudnt quit understand what you are saying and i would highly recomend you to contact the school through a phone call on :+254  or email us on : kangarugirls@yahoo.com for more accurate details from the administration, kindly remember to mention you have been reffered by kangaru AI Assistant for faster responce.",
          };
        } catch (error) {
          console.error("[GuestChat] Error:", error);
          return {
            success: false,
            message:
              "Sorry, there's a technical issue right now. Please try again later,or contact the school for further assistant through email : kangarugirls@yahoo.com , or call us on +254",
          };
        }
      }),

    // ─── Student Revision (requires auth) ───
    studentRevision: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          curriculum: z.enum(["8-4-4", "CBE"]).default("8-4-4"),
          subject: z.string().optional(),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const { message, curriculum, subject, conversationHistory } = input;
          const userId = ctx.user.id;

          // Build enhanced system prompt with curriculum context
          const systemPrompt = `${STUDENT_SYSTEM_PROMPT}\n\nThe student is using the ${curriculum} curriculum${
            subject ? ` and studying ${subject}` : ""
          }.`;

          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: message },
          ];

          const result = await invokeLLM({
            model: STUDENT_MODEL,
            messages: messages.map((m) => ({
              role: m.role as "user" | "system" | "assistant",
              content: m.content,
            })),
          });

          const response = result.choices?.[0]?.message?.content;

          if (typeof response === "string" && response.trim()) {
            // Save chat history
            const updatedHistory = [
              ...conversationHistory,
              { role: "user" as const, content: message },
              { role: "assistant" as const, content: response },
            ];
            await saveChatHistoryToDb(userId, "student", updatedHistory);

            return {
              success: true,
              message: response,
              userId,
            };
          }

          return {
            success: false,
            message: "I couldn't generate a response. Please try again.",
            userId,
          };
        } catch (error) {
          console.error("[StudentRevision] Error:", error);
          return {
            success: false,
            message:
              "Sorry, there's a technical issue right now. Please try again later.",
            userId: ctx.user.id,
          };
        }
      }),

    // ─── Teacher Lesson Plan (requires auth) ───
    teacherLessonPlan: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          subject: z.string().min(1, "Subject is required"),
          gradeLevel: z.string().min(1, "Grade level is required"),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const { message, subject, gradeLevel, conversationHistory } = input;
          const userId = ctx.user.id;

          const systemPrompt = `${TEACHER_LESSON_SYSTEM_PROMPT}\n\nThe teacher is planning for ${subject} at ${gradeLevel} level.`;

          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: message },
          ];

          const result = await invokeLLM({
            model: TEACHER_MODEL,
            messages: messages.map((m) => ({
              role: m.role as "user" | "system" | "assistant",
              content: m.content,
            })),
          });

          const response = result.choices?.[0]?.message?.content;

          if (typeof response === "string" && response.trim()) {
            // Save chat history
            const updatedHistory = [
              ...conversationHistory,
              { role: "user" as const, content: message },
              { role: "assistant" as const, content: response },
            ];
            await saveChatHistoryToDb(userId, "teacher", updatedHistory);

            return {
              success: true,
              message: response,
              userId,
            };
          }

          return {
            success: false,
            message: "I couldn't generate a response. Please try again.",
            userId,
          };
        } catch (error) {
          console.error("[TeacherLessonPlan] Error:", error);
          return {
            success: false,
            message:
              "Sorry, there's a technical issue right now. Please try again later.",
            userId: ctx.user.id,
          };
        }
      }),

    // ─── Teacher Timetable (requires auth) ───
    teacherTimetable: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          subjects: z.array(z.string()).min(1, "At least one subject is required"),
          classes: z.array(z.string()).min(1, "At least one class is required"),
          availability: z.string().optional(),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const {
            message,
            subjects,
            classes,
            availability,
            conversationHistory,
          } = input;
          const userId = ctx.user.id;

          const systemPrompt = `${TEACHER_TIMETABLE_SYSTEM_PROMPT}\n\nTeacher details:\n- Subjects: ${subjects.join(", ")}\n- Classes: ${classes.join(", ")}${
            availability ? `\n- Availability constraints: ${availability}` : ""
          }`;

          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: message },
          ];

          const result = await invokeLLM({
            model: TEACHER_MODEL,
            messages: messages.map((m) => ({
              role: m.role as "user" | "system" | "assistant",
              content: m.content,
            })),
          });

          const response = result.choices?.[0]?.message?.content;

          if (typeof response === "string" && response.trim()) {
            // Save chat history
            const updatedHistory = [
              ...conversationHistory,
              { role: "user" as const, content: message },
              { role: "assistant" as const, content: response },
            ];
            await saveChatHistoryToDb(userId, "teacher", updatedHistory);

            return {
              success: true,
              message: response,
              userId,
            };
          }

          return {
            success: false,
            message: "I couldn't generate a response. Please try again.",
            userId,
          };
        } catch (error) {
          console.error("[TeacherTimetable] Error:", error);
          return {
            success: false,
            message:
              "Sorry, there's a technical issue right now. Please try again later.",
            userId: ctx.user.id,
          };
        }
      }),

    // ─── Load Chat History ───
    loadChatHistory: protectedProcedure
      .input(
        z.object({
          portalType: z.enum(["guest", "student", "teacher"]),
        })
      )
      .query(async ({ input, ctx }) => {
        try {
          const messages = await loadChatHistoryFromDb(
            ctx.user.id,
            input.portalType
          );

          return {
            success: true,
            messages: messages || [],
          };
        } catch (error) {
          console.error("[LoadChatHistory] Error:", error);
          return { success: true, messages: [] };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
