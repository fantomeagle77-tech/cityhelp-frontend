import MailIcon from "../assets/icons/mail.svg";
import TelegramIcon from "../assets/icons/telegram.svg";

export default function AboutPage() {
  return (
    <div className="about-page">
      <h1>О проекте</h1>

      <p>
        «Аналитика городской среды» — Открытая статистика обращений и состояния жилых домов.
      </p>

      <p>
        Пользователи могут видеть реальную обстановку в своём доме, дворе, районе
        оставлять жалобы и анализировать ситуацию.
      </p>

      <h2>Важно</h2>

      <p>
        CityHelp — <strong>частная независимая инициатива</strong>. Проект <strong>не является государственным сервисом</strong>,
        не относится к ЖКХ, администрации или другим официальным структурам.
      </p>
      
      <p>
        Цель проекта — помочь жителям <strong>трезво и наглядно</strong> оценивать состояние дома и двора,
        делиться наблюдениями и находить поддержку рядом.
        Мы не собираем «досье», не используем данные для наказаний и не занимаемся «проверками».
      </p>
      
      <p>
        Здесь публикуются сообщения от пользователей: они могут быть субъективными.
        Поэтому мы поощряем <strong>корректные формулировки</strong>, факты и, по возможности, подтверждения.
        Если проблема решена — это тоже важно отметить.
      </p>
      
      <h2>Зачем это нужно?</h2>

      <ul>
        <li>Понимание реальной ситуации в районе</li>
        <li>Совместное участие в улучшении среды</li>
        <li>Мнения и наблюдения жителей без искажений</li>
        <li>Честный взгляд на район</li>
        <li>Сообщество, которое заботится</li>
        <li>Реальные истории от жителей</li>
        <li>Открытая информация о жизни района</li>
        <li>Вклад каждого в общее благо</li>
        <li>Живые отзывы и опыт соседей</li>
      </ul>

      <h2>Как работает система статусов?</h2>

      <ul>
        <li>🟢 Норма — жалоб нет</li>
        <li>🟡 Есть жалобы</li>
        <li>🟠 Проблемно</li>
        <li>🔴 Критично</li>
      </ul>

      {/* Контакты */}
      <section className="about-contacts">
        <h2>Контакты</h2>

        <div className="contact-row">
          {/* Email */}
          <a className="contact-btn" href="mailto:fantomeagle77@gmail.com">
            <span className="contact-ico">
              <img src={MailIcon} alt="" className="contact-svg" />
            </span>
            <span>fantomeagle77@gmail.com</span>
          </a>

          {/* Telegram */}
          <a
            className="contact-btn"
            href="https://t.me/alphasoftlab"
            target="_blank"
            rel="noreferrer"
            title="По вопросам сотрудничества и поддержки проекта"
          >
            <span className="contact-ico">
              <img src={TelegramIcon} alt="" className="contact-svg" />
            </span>
            <span>Telegram: @alphasoftlab</span>
          </a>

          <div className="contact-note">
            По вопросам сотрудничества и поддержки проекта — пишите в Telegram. Проект частный, открытый и сделан для жителей.
          </div>
        </div>
      </section>
    </div>
  );
}
