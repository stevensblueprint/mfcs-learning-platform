import styles from "./Alert.module.css";

export default function Alert({
  id,
  title,
  detail,
  messages = [],
}: {
  id?: string;
  title?: string;
  detail?: string;
  messages?: string[];
}) {
  return (
    <div id={id} role="alert" className={styles.alert}>
      <span className={styles.icon} aria-hidden="true" />
      <div>
        {title && <p className={styles.title}>{title}</p>}
        {detail && <p className={styles.detail}>{detail}</p>}
        {messages.map((message, index) => (
          <p className={styles.title} key={`${index}-${message}`}>
            {message}
          </p>
        ))}
      </div>
    </div>
  );
}
